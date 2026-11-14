import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { annotations as mockAnnotations, frames as mockFrames } from "@/lib/mock-data";
import { SCALE_POINTS, defaultScale, normalizeScale, type ScaleConfig } from "@/lib/scale";
import type { AnnotationAnswer, Frame, ParticipantDetail, ParticipantSummary, RatingCounts, Statistics } from "@/types/domain";

/**
 * Data access layer. Uses MongoDB (via Prisma) when DATABASE_URL is set,
 * otherwise falls back to the in-memory mock data so the UI still runs.
 */
export const hasDatabase = Boolean(process.env.DATABASE_URL);

const objectId = /^[a-f\d]{24}$/i;

/** Uploaded frames are stored in the database; they are served from an image route instead of inlined. */
function frameImageUrl(row: { id: string; frameImage: string; updatedAt: Date }) {
  return row.frameImage.startsWith("data:") ? `/api/frames/${row.id}/image?v=${row.updatedAt.getTime()}` : row.frameImage;
}

// ---------- Rating helpers ----------

function emptyCounts(): RatingCounts {
  return Array.from({ length: SCALE_POINTS }, () => 0);
}

function countRatings(ratings: number[]): RatingCounts {
  const counts = emptyCounts();
  for (const rating of ratings) if (rating >= 1 && rating <= SCALE_POINTS) counts[rating - 1] += 1;
  return counts;
}

function average(ratings: number[]) {
  if (ratings.length === 0) return 0;
  return Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10;
}

// ---------- Study: frames, scale, participants, ratings ----------

export async function getFrames(): Promise<Frame[]> {
  if (!hasDatabase) return mockFrames;

  const rows = await prisma.frame.findMany({ orderBy: { sequence: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    movie: row.movie,
    frameImage: frameImageUrl(row),
    timecode: row.timecode,
    director: row.director,
    dop: row.dop,
    sequence: row.sequence,
    notes: row.notes ?? undefined
  }));
}

export async function getScale(): Promise<ScaleConfig> {
  if (!hasDatabase) return defaultScale;
  try {
    const row = await prisma.setting.findUnique({ where: { key: "scale" } });
    return normalizeScale(row?.value);
  } catch (error) {
    console.error("Could not load the rating scale", error);
    return defaultScale;
  }
}

export async function saveScale(scale: ScaleConfig) {
  const value = normalizeScale(scale) as unknown as Prisma.InputJsonValue;
  await prisma.setting.upsert({ where: { key: "scale" }, create: { key: "scale", value }, update: { value } });
}

export async function createParticipant(input: { name: string; profession: string; avatar?: string }) {
  if (!hasDatabase) return { id: `local-${Date.now()}`, ...input };
  return prisma.participant.create({ data: input });
}

export async function saveAnnotation(input: {
  participantId: string;
  frameId: string;
  answer: AnnotationAnswer;
  rating: number;
  notes?: string;
}) {
  if (!hasDatabase) {
    const annotation = {
      participantId: input.participantId,
      frameId: input.frameId,
      answer: input.answer,
      rating: input.rating,
      notes: input.notes,
      timestamp: new Date().toISOString()
    };
    mockAnnotations.set(`${input.participantId}:${input.frameId}`, annotation);
    return annotation;
  }

  const row = await prisma.annotation.upsert({
    where: { participantId_frameId: { participantId: input.participantId, frameId: input.frameId } },
    create: input,
    update: { answer: input.answer, rating: input.rating, notes: input.notes, timestamp: new Date() }
  });
  return { frameId: row.frameId, answer: input.answer, rating: row.rating ?? input.rating, notes: row.notes ?? undefined, timestamp: row.timestamp.toISOString() };
}

// ---------- Admin: analytics ----------

export async function getStatistics(): Promise<Statistics> {
  const [frames, rows, participants] = hasDatabase
    ? await Promise.all([
        prisma.frame.findMany({ select: { id: true, movie: true } }),
        prisma.annotation.findMany({ select: { frameId: true, rating: true, answer: true, participantId: true } }),
        prisma.participant.findMany({ select: { id: true, profession: true, deletedAt: true } })
      ])
    : [
        mockFrames.map((frame) => ({ id: frame.id, movie: frame.movie })),
        [...mockAnnotations.values()].map((item) => ({
          frameId: item.frameId,
          rating: item.rating as number | null,
          answer: (item.answer ?? null) as AnnotationAnswer | null,
          participantId: item.participantId ?? ""
        })),
        [] as Array<{ id: string; profession: string; deletedAt: Date | null }>
      ];

  const inBin = new Set(participants.filter((item) => item.deletedAt).map((item) => item.id));
  const people = participants.filter((item) => !item.deletedAt);

  // Older responses used a three-way answer and have no rating; they are left out of the numbers.
  // Participants in the bin are left out too.
  const rated = rows.filter(
    (row): row is typeof row & { rating: number } => typeof row.rating === "number" && !inBin.has(row.participantId)
  );
  const ratings = rated.map((row) => row.rating);
  const answeredFrames = new Set(rated.map((row) => row.frameId)).size;
  const professionOf = new Map(participants.map((item) => [item.id, item.profession]));

  return {
    participants: people.length,
    totalFrames: frames.length,
    totalAnnotations: rated.length,
    completionPercent: frames.length === 0 ? 0 : Math.round((answeredFrames / frames.length) * 100),
    averageRating: average(ratings),
    distribution: countRatings(ratings),
    categories: Object.fromEntries(
      (["UNCONVENTIONAL", "CONVENTIONAL", "NOT_SURE"] as const).map((key) => {
        const mine = rated.filter((row) => row.answer === key).map((row) => row.rating);
        return [key, { count: mine.length, percent: rated.length ? Math.round((mine.length / rated.length) * 100) : 0, average: average(mine) }];
      })
    ) as Statistics["categories"],
    movies: [...new Set(frames.map((frame) => frame.movie))].map((movie) => {
      const ids = new Set(frames.filter((frame) => frame.movie === movie).map((frame) => frame.id));
      const mine = rated.filter((row) => ids.has(row.frameId)).map((row) => row.rating);
      return { movie, frames: ids.size, annotations: mine.length, average: average(mine), counts: countRatings(mine) };
    }),
    professions: [...new Set(people.map((item) => item.profession))].map((profession) => {
      const inRole = people.filter((item) => item.profession === profession);
      const mine = rated.filter((row) => professionOf.get(row.participantId) === profession).map((row) => row.rating);
      return { profession, participants: inRole.length, annotations: mine.length, average: average(mine), counts: countRatings(mine) };
    })
  };
}

function summarize(rows: Array<{ answer?: AnnotationAnswer | null; rating: number }>) {
  if (rows.length === 0) return "Not rated";
  const ratings = rows.map((row) => row.rating);
  const by = (key: AnnotationAnswer) => rows.filter((row) => row.answer === key).length;
  return `${rows.length} responses, average ${average(ratings)}. Unconventional ${by("UNCONVENTIONAL")}, Conventional ${by("CONVENTIONAL")}, Not sure ${by("NOT_SURE")}`;
}

export async function getExportRows() {
  if (!hasDatabase) {
    return mockFrames.map((frame) => {
      const found = [...mockAnnotations.values()].filter((item) => item.frameId === frame.id);
      return { ...frame, summary: summarize(found.map((item) => ({ answer: item.answer, rating: item.rating }))) };
    });
  }

  const rows = await prisma.frame.findMany({
    orderBy: { sequence: "asc" },
    include: { annotations: { include: { participant: true } } }
  });

  return rows.map((frame) => {
    const rated = frame.annotations.filter(
      (item): item is typeof item & { rating: number } => typeof item.rating === "number" && !item.participant.deletedAt
    );
    return {
      id: frame.id,
      movie: frame.movie,
      frameImage: frameImageUrl(frame),
      timecode: frame.timecode,
      director: frame.director,
      dop: frame.dop,
      sequence: frame.sequence,
      summary: summarize(rated.map((item) => ({ answer: item.answer, rating: item.rating }))),
      annotations: rated.map((item) => ({
        answer: item.answer,
        rating: item.rating,
        participant: item.participant.name,
        profession: item.participant.profession,
        timestamp: item.timestamp.toISOString()
      }))
    };
  });
}

// ---------- Admin: participants ----------

async function loadParticipants(): Promise<ParticipantSummary[]> {
  if (!hasDatabase) return [];

  const rows = await prisma.participant.findMany({
    orderBy: { createdAt: "desc" },
    include: { annotations: { select: { rating: true } } }
  });

  return rows.map((row) => {
    const ratings = row.annotations.map((item) => item.rating).filter((value): value is number => typeof value === "number");
    return {
      id: row.id,
      name: row.name,
      profession: row.profession,
      avatar: row.avatar ?? undefined,
      createdAt: row.createdAt.toISOString(),
      deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
      answered: ratings.length,
      average: average(ratings)
    };
  });
}

export async function getParticipants(): Promise<ParticipantSummary[]> {
  return (await loadParticipants()).filter((item) => !item.deletedAt);
}

/** Participants an admin has moved to the bin, most recently deleted first. */
export async function getDeletedParticipants(): Promise<ParticipantSummary[]> {
  return (await loadParticipants())
    .filter((item) => item.deletedAt)
    .sort((a, b) => (b.deletedAt as string).localeCompare(a.deletedAt as string));
}

export async function getParticipant(id: string): Promise<ParticipantDetail | null> {
  if (!hasDatabase || !objectId.test(id)) return null;

  const [row, totalFrames] = await Promise.all([
    prisma.participant.findUnique({
      where: { id },
      include: { annotations: { include: { frame: true }, orderBy: { frame: { sequence: "asc" } } } }
    }),
    prisma.frame.count()
  ]);
  if (!row || row.deletedAt) return null;

  const responses = row.annotations
    .filter((item): item is typeof item & { rating: number } => typeof item.rating === "number")
    .map((item) => ({
      frameId: item.frameId,
      movie: item.frame.movie,
      frameImage: frameImageUrl(item.frame),
      timecode: item.frame.timecode,
      answer: item.answer ?? undefined,
      rating: item.rating,
      timestamp: item.timestamp.toISOString()
    }));

  return {
    id: row.id,
    name: row.name,
    profession: row.profession,
    avatar: row.avatar ?? undefined,
    createdAt: row.createdAt.toISOString(),
    totalFrames,
    answered: responses.length,
    average: average(responses.map((item) => item.rating)),
    responses
  };
}

// ---------- Admin: frame management ----------

export type FrameInput = {
  movie: string;
  frameImage: string;
  timecode: string;
  director: string;
  dop: string;
  notes?: string;
};

export async function getAdminFrames(): Promise<Array<Frame & { responses: number }>> {
  if (!hasDatabase) return mockFrames.map((frame) => ({ ...frame, responses: 0 }));

  const rows = await prisma.frame.findMany({
    orderBy: { sequence: "asc" },
    include: { _count: { select: { annotations: true } } }
  });

  return rows.map((row) => ({
    id: row.id,
    movie: row.movie,
    frameImage: frameImageUrl(row),
    timecode: row.timecode,
    director: row.director,
    dop: row.dop,
    sequence: row.sequence,
    notes: row.notes ?? undefined,
    responses: row._count.annotations
  }));
}

export async function createFrame(input: FrameInput) {
  const last = await prisma.frame.findFirst({ orderBy: { sequence: "desc" }, select: { sequence: true } });
  return prisma.frame.create({ data: { ...input, sequence: (last?.sequence ?? 0) + 1 } });
}

export async function updateFrame(id: string, input: Partial<FrameInput>) {
  return prisma.frame.update({ where: { id }, data: input });
}

export async function deleteFrame(id: string) {
  // Responses to a deleted frame are removed with it.
  await prisma.annotation.deleteMany({ where: { frameId: id } });
  await prisma.frame.delete({ where: { id } });
}

/** Returns the stored image for a frame as bytes, when it was uploaded rather than a static file. */
export async function getFrameImage(id: string) {
  if (!hasDatabase || !objectId.test(id)) return null;
  const row = await prisma.frame.findUnique({ where: { id }, select: { frameImage: true } });
  const match = row?.frameImage.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return null;
  return { type: match[1], bytes: Buffer.from(match[2], "base64") };
}

/** Saves a new frame order. `ids` must list every existing frame exactly once. */
export async function reorderFrames(ids: string[]) {
  const existing = await prisma.frame.findMany({ select: { id: true } });
  const known = new Set(existing.map((item) => item.id));
  if (ids.length !== known.size || new Set(ids).size !== ids.length || !ids.every((id) => known.has(id))) {
    throw new Error("Order does not match the current frames");
  }

  // `sequence` is unique, so first park every frame on a temporary number, then set the final one.
  await prisma.$transaction([
    ...ids.map((id, index) => prisma.frame.update({ where: { id }, data: { sequence: 1_000_000 + index } })),
    ...ids.map((id, index) => prisma.frame.update({ where: { id }, data: { sequence: index + 1 } }))
  ]);
}

/** Moves participants to the bin. Their ratings are kept but no longer counted. */
export async function binParticipants(ids: string[]) {
  await prisma.participant.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
}

/** Brings participants back from the bin, with all their ratings counted again. */
export async function restoreParticipants(ids: string[]) {
  await prisma.participant.updateMany({ where: { id: { in: ids } }, data: { deletedAt: null } });
}

/** Removes participants for good: their profile (including photo) and every rating they gave. */
export async function purgeParticipants(ids: string[]) {
  await prisma.$transaction([
    prisma.annotation.deleteMany({ where: { participantId: { in: ids } } }),
    prisma.participant.deleteMany({ where: { id: { in: ids } } })
  ]);
}
