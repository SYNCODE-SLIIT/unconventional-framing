import { NextResponse } from "next/server";
import { z } from "zod";
import { binParticipants, hasDatabase, purgeParticipants, restoreParticipants } from "@/lib/data";

const bodySchema = z.object({
  action: z.enum(["delete", "restore", "purge"]),
  ids: z
    .array(z.string().regex(/^[a-f\d]{24}$/i))
    .min(1)
    .max(500)
});

/**
 * delete  = move to the bin (can be restored)
 * restore = bring back from the bin
 * purge   = remove from the database for good
 */
export async function POST(request: Request) {
  if (!hasDatabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { action, ids } = parsed.data;
  try {
    if (action === "delete") await binParticipants(ids);
    else if (action === "restore") await restoreParticipants(ids);
    else await purgeParticipants(ids);
  } catch {
    return NextResponse.json({ error: "Could not update participants" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
