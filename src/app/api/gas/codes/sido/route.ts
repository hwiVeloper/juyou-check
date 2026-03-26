import { NextResponse } from "next/server";
import { fetchSidoCodes } from "@/lib/opinet";

export async function GET() {
  const data = await fetchSidoCodes();
  return NextResponse.json(data.RESULT, {
    headers: { "Cache-Control": "public, s-maxage=86400" },
  });
}
