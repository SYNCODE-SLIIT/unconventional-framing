import { NextResponse } from "next/server";
import { getFrames, getScale } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [frames, scale] = await Promise.all([getFrames(), getScale()]);
  return NextResponse.json({ frames, scale });
}
