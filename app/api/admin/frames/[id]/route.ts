import { NextResponse } from "next/server";
import { deleteFrame, hasDatabase, updateFrame } from "@/lib/data";
import { frameUpdateSchema } from "@/lib/frame-schema";

const objectId = /^[a-f\d]{24}$/i;

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  if (!hasDatabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  if (!objectId.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const parsed = frameUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    await updateFrame(id, parsed.data);
  } catch {
    return NextResponse.json({ error: "Frame not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!hasDatabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  if (!objectId.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await deleteFrame(id);
  } catch {
    return NextResponse.json({ error: "Frame not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
