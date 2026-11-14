import { prisma } from "@/lib/prisma";
import { annotations as mockAnnotations, calculateStatistics as mockStatistics, frames as mockFrames } from "@/lib/mock-data";
import type { AnnotationAnswer, Frame, ParticipantDetail, ParticipantSummary, Statistics } from "@/types/domain";

/**
 * Data access layer. Uses MongoDB (via Prisma) when DATABASE_URL is set,
 * otherwise falls back to the in-memory mock data so the UI still runs.
 */
export const hasDatabase = Boolean(process.env.DATABASE_URL);

/** Uploaded frames are stored in the database; they are served from an image route instead of inlined. */
function frameImageUrl(row: { id: string; frameImage: string; updatedAt: Date }) {
  return row.frameImage.startsWith("data:") ? `/api/frames/${row.id}/image?v=${row.updatedAt.getTime()}` : row.frameImage;
}

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

export async function createParticipant(input: { name: string; profession: string; avatar?: string }) {
  if (!hasDatabase) return { id: `local-${Date.now()}`, ...input };
  return prisma.participant.create({ data: input });
}

export async function saveAnnotation(input: {
  participantId: string;
  frameId: string;
  answer: AnnotationAnswer;
  notes?: string;
}) {
  if (!hasDatabase) {
    const annotation = {
      frameId: input.frameId,
      answer: input.answer,
      notes: input.notes,
      timestamp: new Date().toISOString()
    };
    mockAnnotations.set(`${input.participantId}:${input.frameId}`, annotation);
    return annotation;
  }

  const row = await prisma.annotation.upsert({
    where: { participantId_frameId: { participantId: input.participantId, frameId: input.frameId } },
    create: input,
    update: { answer: input.answer, notes: input.notes, timestamp: new Date() }
  });
  return { frameId: row.frameId, answer: row.answer, notes: row.notes ?? undefined, timestamp: row.timestamp.toISOString() };
}

export async function getStatistics(): Promise<Statistics> {
  if (!hasDatabase) return mockStatistics();

  const [frames, rows, participants] = await Promise.all([
    prisma.frame.findMany({ select: { id: true, movie: true } }),
    prisma.annotation.findMany({ select: { frameId: true, answer: true, participantId: true } }),
    prisma.participant.findMany({ select: { id: true, profession: true } })
  ]);

  const count = (answer: AnnotationAnswer, list = rows) => list.filter((row) => row.answer === answer).length;
  const percent = (value: number) => (rows.length === 0 ? 0 : Math.round((value / rows.length) * 100));
  const answeredFrames = new Set(rows.map((row) => row.frameId)).size;

  const professionOf = new Map(participants.map((item) => [item.id, item.profession]));

  return {
    participants: participants.length,
    professions: [...new Set(participants.map((item) => item.profession))].map((profession) => {
      const people = participants.filter((item) => item.profession === profession);
      const mine = rows.filter((row) => professionOf.get(row.participantId) === profession);
      return {
        profession,
        participants: people.length,
        conventional: count("CONVENTIONAL", mine),
        unconventional: count("UNCONVENTIONAL", mine),
        notSure: count("NOT_SURE", mine)
      };
    }),
    totalFrames: frames.length,
    totalAnnotations: rows.length,
    completionPercent: frames.length === 0 ? 0 : Math.round((answeredFrames / frames.length) * 100),
    conventionalPercent: percent(count("CONVENTIONAL")),
    unconventionalPercent: percent(count("UNCONVENTIONAL")),
    notSurePercent: percent(count("NOT_SURE")),
    movies: [...new Set(frames.map((frame) => frame.movie))].map((movie) => {
      const ids = new Set(frames.filter((frame) => frame.movie === movie).map((frame) => frame.id));
      const movieRows = rows.filter((row) => ids.has(row.frameId));
      return {
        movie,
        frames: ids.size,
        annotations: movieRows.length,
        conventional: count("CONVENTIONAL", movieRows),
        unconventional: count("UNCONVENTIONAL", movieRows),
        notSure: count("NOT_SURE", movieRows)
      };
    })
  };
}

function summarize(answers: AnnotationAnswer[]) {
  if (answers.length === 0) return "Not annotated";
  const count = (answer: AnnotationAnswer) => answers.filter((item) => item === answer).length;
  return `${answers.length} total - Unconventional ${count("UNCONVENTIONAL")}, Conventional ${count("CONVENTIONAL")}, Not sure ${count("NOT_SURE")}`;
}

export async function getExportRows() {
  if (!hasDatabase) {
    return mockFrames.map((frame) => {
      const found = [...mockAnnotations.values()].filter((item) => item.frameId === frame.id);
      return { ...frame, summary: summarize(found.map((item) => item.answer)) };
    });
  }

  const rows = await prisma.frame.findMany({
    orderBy: { sequence: "asc" },
    include: { annotations: { include: { participant: true } } }
  });

  return rows.map((frame) => ({
    id: frame.id,
    movie: frame.movie,
    frameImage: frameImageUrl(frame),
    timecode: frame.timecode,
    director: frame.director,
    dop: frame.dop,
    sequence: frame.sequence,
    summary: summarize(frame.annotations.map((item) => item.answer)),
    annotations: frame.annotations.map((item) => ({
      answer: item.answer,
      participant: item.participant.name,
      profession: item.participant.profession,
      timestamp: item.timestamp.toISOString()
    }))
  }));
}

const objectId = /^[a-f\d]{24}$/i;

function tally(answers: AnnotationAnswer[]) {
  const count = (answer: AnnotationAnswer) => answers.filter((item) => item === answer).length;
  return {
    answered: answers.length,
    conventional: count("CONVENTIONAL"),
    unconventional: count("UNCONVENTIONAL"),
    notSure: count("NOT_SURE")
  };
}

export async function getParticipants(): Promise<ParticipantSummary[]> {
  if (!hasDatabase) return [];

  const rows = await prisma.participant.findMany({
    orderBy: { createdAt: "desc" },
    include: { annotations: { select: { answer: true } } }
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    profession: row.profession,
    avatar: row.avatar ?? undefined,
    createdAt: row.createdAt.toISOString(),
    ...tally(row.annotations.map((item) => item.answer))
  }));
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
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    profession: row.profession,
    avatar: row.avatar ?? undefined,
    createdAt: row.createdAt.toISOString(),
    totalFrames,
    ...tally(row.annotations.map((item) => item.answer)),
    responses: row.annotations.map((item) => ({
      frameId: item.frameId,
      movie: item.frame.movie,
      frameImage: frameImageUrl(item.frame),
      timecode: item.frame.timecode,
      answer: item.answer,
      timestamp: item.timestamp.toISOString()
    }))
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
