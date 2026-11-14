import { NextResponse } from "next/server";
import { z } from "zod";
import { createVideo, hasDatabase } from "@/lib/data";
import { MAX_VIDEO_BYTES, VIDEO_TYPES } from "@/lib/video";

const schema = z.object({
  filename: z.string().trim().min(1).max(300),
  contentType: z.string().refine((value) => VIDEO_TYPES.includes(value), "Use an MP4, WebM or MOV video."),
  size: z.number().int().min(1).max(MAX_VIDEO_BYTES)
});

/** Step 1 of an upload: announce the file. The pieces follow, then `complete`. */
export async function POST(request: Request) {
  if (!hasDatabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Use an MP4, WebM or MOV video up to ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} MB.` },
      { status: 400 }
    );
  }

  const video = await createVideo(parsed.data);
  return NextResponse.json({ id: video.id }, { status: 201 });
}
