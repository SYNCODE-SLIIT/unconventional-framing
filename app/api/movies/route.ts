import { NextResponse } from "next/server";
import { getFrames } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const frames = await getFrames();
  return NextResponse.json({
    movies: [...new Set(frames.map((frame) => frame.movie))].sort()
  });
}
