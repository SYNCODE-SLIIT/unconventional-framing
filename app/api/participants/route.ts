import { NextResponse } from "next/server";
import { z } from "zod";
import { createParticipant } from "@/lib/data";

const participantSchema = z.object({
  name: z.string().trim().min(1).max(120),
  profession: z.string().trim().min(1).max(120),
  avatar: z
    .string()
    .max(150_000)
    .regex(/^data:image\/(jpeg|png|webp);base64,/)
    .optional()
});

export async function POST(request: Request) {
  const parsed = participantSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const participant = await createParticipant(parsed.data);
  return NextResponse.json({ participant }, { status: 201 });
}
