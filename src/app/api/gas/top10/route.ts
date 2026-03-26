import { NextRequest, NextResponse } from "next/server";
import { fetchTop10, getBrandInfo } from "@/lib/opinet";
import { katecToWgs84 } from "@/lib/coord-transform";
import type { FuelCode } from "@/lib/opinet";

export async function GET(req: NextRequest) {
  const prodcd = (req.nextUrl.searchParams.get("prodcd") ?? "B027") as FuelCode;
  // PDF 기준 파라미터: area (미전달=전국, 2자리=시도, 4자리=시군구)
  const area = req.nextUrl.searchParams.get("area") ?? "";
  const cnt = parseInt(req.nextUrl.searchParams.get("cnt") ?? "10");
  try {
    const data = await fetchTop10(prodcd, area || undefined, cnt);
    const stations = (data.RESULT?.OIL ?? []).map((s, i) => {
      const brand = getBrandInfo(s.POLL_DIV_CD);
      // GIS_X_COOR/GIS_Y_COOR는 KATEC 좌표 → WGS84 변환
      const wgs84 = katecToWgs84(s.GIS_X_COOR, s.GIS_Y_COOR);
      return {
        rank: i + 1,
        id: s.UNI_ID,
        name: s.OS_NM,
        brand: brand.label,
        brandCode: s.POLL_DIV_CD,
        brandColor: brand.color,
        price: Number(s.PRICE) || 0,
        address: s.NEW_ADR ?? s.VAN_ADR ?? s.ADDR ?? "",
        lat: wgs84.lat,
        lng: wgs84.lng,
      };
    });
    return NextResponse.json({ stations }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ stations: [] });
  }
}
