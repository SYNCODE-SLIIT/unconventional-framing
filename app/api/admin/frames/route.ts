import { NextResponse } from "next/server";
import { createFrame, hasDatabase } from "@/lib/data";
import { frameCreateSchema } from "@/lib/frame-schema";

export async function POST(request: Request) {
  if (!hasDatabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const parsed = frameCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const frame = await createFrame(parsed.data);
  return NextResponse.json({ id: frame.id }, { status: 201 });
}
