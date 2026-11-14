import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase, saveScale } from "@/lib/data";
import { SCALE_POINTS } from "@/lib/scale";

const label = z.string().trim().min(1).max(60);
const labels = z.array(label).length(SCALE_POINTS);

const scaleSchema = z.object({
  question: z.object({ en: z.string().trim().min(1).max(200), si: z.string().trim().min(1).max(200) }),
  labels: z.object({ en: labels, si: labels })
});

export async function PATCH(request: Request) {
  if (!hasDatabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const parsed = scaleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await saveScale(parsed.data);
  return NextResponse.json({ ok: true });
}
