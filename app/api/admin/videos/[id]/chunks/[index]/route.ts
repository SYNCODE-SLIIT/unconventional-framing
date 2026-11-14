import { NextResponse } from "next/server";
import { hasDatabase, saveVideoChunk } from "@/lib/data";
import { VIDEO_CHUNK } from "@/lib/video";

const objectId = /^[a-f\d]{24}$/i;

type Context = { params: Promise<{ id: string; index: string }> };

/** Step 2: one piece of the file, sent as raw bytes. */
export async function PUT(request: Request, { params }: Context) {
  const { id, index } = await params;
  if (!hasDatabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const position = Number(index);
  if (!objectId.test(id) || !Number.isInteger(position) || position < 0 || position > 100_000) {
    return NextResponse.json({ error: "Invalid piece" }, { status: 400 });
  }

  const data = Buffer.from(await request.arrayBuffer());
  if (data.length === 0 || data.length > VIDEO_CHUNK) {
    return NextResponse.json({ error: "Piece has the wrong size" }, { status: 400 });
  }

  try {
    await saveVideoChunk(id, position, data);
  } catch {
    return NextResponse.json({ error: "Could not store this piece" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
