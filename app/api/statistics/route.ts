import { NextResponse } from "next/server";
import { calculateStatistics } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(calculateStatistics());
}
