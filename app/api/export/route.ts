import { NextResponse } from "next/server";
import { getExportRows } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({
    title: "Unconventional Framing Research Report",
    researcher: "Researcher",
    date: new Date().toISOString(),
    frames: await getExportRows()
  });
}
