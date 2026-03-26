import { NextResponse } from "next/server";
import { fetchSidoCodes } from "@/lib/opinet";

export async function GET() {
  try {
    const data = await fetchSidoCodes();
    return NextResponse.json(data.RESULT, {
      headers: { "Cache-Control": "public, s-maxage=86400" },
    });
  } catch {
    return NextResponse.json({ OIL: [] });
  }
}
