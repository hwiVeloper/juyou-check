import { NextRequest, NextResponse } from "next/server";
import { fetchTop10, getBrandInfo } from "@/lib/opinet";
import type { FuelCode } from "@/lib/opinet";

export async function GET(req: NextRequest) {
  const prodcd = (req.nextUrl.searchParams.get("prodcd") ?? "B027") as FuelCode;
  const sido = req.nextUrl.searchParams.get("sido") ?? "01";
  const data = await fetchTop10(prodcd, sido);
  const stations = (data.RESULT?.OIL ?? []).map((s, i) => {
    const brand = getBrandInfo(s.POLL_DIV_CD);
    return {
      rank: i + 1,
      id: s.UNI_ID,
      name: s.OS_NM,
      brand: brand.label,
      brandCode: s.POLL_DIV_CD,
      brandColor: brand.color,
      price: Number(s.PRICE) || 0,
      address: s.NEW_ADR ?? s.VAN_ADR ?? s.ADDR ?? "",
      lat: s.GIS_Y_COOR,
      lng: s.GIS_X_COOR,
    };
  });
  return NextResponse.json({ stations }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60" },
  });
}
