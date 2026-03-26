import { NextRequest, NextResponse } from "next/server";
import { fetchSigunCodes } from "@/lib/opinet";

export async function GET(req: NextRequest) {
  const sidocd = req.nextUrl.searchParams.get("sidocd") ?? "01";
  try {
    const data = await fetchSigunCodes(sidocd);
    return NextResponse.json(data.RESULT, {
      headers: { "Cache-Control": "public, s-maxage=86400" },
    });
  } catch {
    return NextResponse.json({ OIL: [] });
  }
}
