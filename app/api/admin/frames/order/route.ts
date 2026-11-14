import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase, reorderFrames } from "@/lib/data";

const orderSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(1000)
});

export async function PATCH(request: Request) {
  if (!hasDatabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

  try {
    await reorderFrames(parsed.data.ids);
  } catch {
    return NextResponse.json({ error: "Could not reorder frames" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
