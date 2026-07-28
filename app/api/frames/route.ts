import { NextResponse } from "next/server";
import { frames } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ frames });
}
