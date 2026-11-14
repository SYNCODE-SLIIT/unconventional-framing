import { NextResponse } from "next/server";
import { completeVideo, deleteVideo, hasDatabase } from "@/lib/data";

const objectId = /^[a-f\d]{24}$/i;

/** Step 3: check every piece arrived, then make the video playable. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasDatabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  if (!objectId.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const ok = await completeVideo(id);
  if (!ok) {
    await deleteVideo(id);
    return NextResponse.json({ error: "The upload was incomplete. Please try again." }, { status: 400 });
  }
  return NextResponse.json({ url: `/api/videos/${id}` });
}
