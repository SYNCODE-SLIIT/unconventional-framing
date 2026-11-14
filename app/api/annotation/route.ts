import { NextResponse } from "next/server";
import { z } from "zod";
import { getFrames, hasDatabase, saveAnnotation } from "@/lib/data";
import { CATEGORIES, SCALE_POINTS } from "@/lib/scale";

const annotationSchema = z.object({
  participantId: z.string().min(1),
  frameId: z.string().min(1),
  answer: z.enum(CATEGORIES),
  rating: z.number().int().min(1).max(SCALE_POINTS),
  notes: z.string().max(2000).optional()
});

const objectId = /^[a-f\d]{24}$/i;

export async function POST(request: Request) {
  const parsed = annotationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (hasDatabase && (!objectId.test(parsed.data.frameId) || !objectId.test(parsed.data.participantId))) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const frames = await getFrames();
  if (!frames.some((frame) => frame.id === parsed.data.frameId)) {
    return NextResponse.json({ error: "Frame not found" }, { status: 404 });
  }

  const annotation = await saveAnnotation(parsed.data);
  return NextResponse.json({ annotation });
}
