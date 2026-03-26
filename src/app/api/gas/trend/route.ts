import { NextRequest, NextResponse } from "next/server";
import { fetchTrend } from "@/lib/opinet";
import type { FuelCode } from "@/lib/opinet";

export async function GET(req: NextRequest) {
  const prodcd = (req.nextUrl.searchParams.get("prodcd") ?? "B027") as FuelCode;
  try {
    const data = await fetchTrend(prodcd);
    return NextResponse.json(data.RESULT, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ OIL: [] });
  }
}
