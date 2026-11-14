import { NextResponse } from "next/server";
import { deleteParticipant, hasDatabase } from "@/lib/data";

const objectId = /^[a-f\d]{24}$/i;

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasDatabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  if (!objectId.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await deleteParticipant(id);
  } catch {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
