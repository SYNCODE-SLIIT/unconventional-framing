import { NextResponse } from "next/server";
import { annotations, frames } from "@/lib/mock-data";

export async function POST() {
  const rows = frames.map((frame) => ({
    ...frame,
    annotation: annotations.get(frame.id) ?? null
  }));

  return NextResponse.json({
    title: "Unconventional Framing Research Report",
    researcher: "Researcher",
    date: new Date().toISOString(),
    frames: rows
  });
}
