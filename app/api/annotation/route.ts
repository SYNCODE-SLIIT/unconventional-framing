import { NextResponse } from "next/server";
import { z } from "zod";
import { annotations, frames } from "@/lib/mock-data";

const annotationSchema = z.object({
  frameId: z.string().min(1),
  answer: z.enum(["UNCONVENTIONAL", "CONVENTIONAL", "NOT_SURE"]),
  notes: z.string().max(2000).optional()
});

export async function POST(request: Request) {
  const parsed = annotationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const frameExists = frames.some((frame) => frame.id === parsed.data.frameId);

  if (!frameExists) {
    return NextResponse.json({ error: "Frame not found" }, { status: 404 });
  }

  const annotation = {
    ...parsed.data,
    timestamp: new Date().toISOString()
  };

  annotations.set(parsed.data.frameId, annotation);

  return NextResponse.json({ annotation });
}
