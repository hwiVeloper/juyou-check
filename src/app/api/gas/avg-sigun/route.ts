import { NextRequest, NextResponse } from "next/server";
import { fetchAvgSigunPrice } from "@/lib/opinet";
import type { FuelCode } from "@/lib/opinet";

export async function GET(req: NextRequest) {
  const prodcd = (req.nextUrl.searchParams.get("prodcd") ?? "B027") as FuelCode;
  const sidocd = req.nextUrl.searchParams.get("sidocd") ?? "01";
  const data = await fetchAvgSigunPrice(prodcd, sidocd);
  return NextResponse.json(data.RESULT, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60" },
  });
}
