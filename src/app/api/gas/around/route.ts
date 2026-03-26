import { NextRequest, NextResponse } from "next/server";
import { wgs84ToKatec, katecToWgs84 } from "@/lib/coord-transform";
import { fetchAroundStations, getBrandInfo } from "@/lib/opinet";
import type { FuelCode } from "@/lib/opinet";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radius = parseInt(searchParams.get("radius") ?? "3");
  const prodcd = (searchParams.get("prodcd") ?? "B027") as FuelCode;
  const sort = (searchParams.get("sort") ?? "1") === "2" ? 2 : 1;

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "lat, lng 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const katec = wgs84ToKatec(lat, lng);
  console.log("[around] lat:", lat, "lng:", lng, "→ KATEC:", katec, "radius:", radius, "prodcd:", prodcd);

  try {
    const data = await fetchAroundStations(katec.x, katec.y, radius, prodcd, sort);
    const stations = (data.RESULT?.OIL ?? []).map((s) => {
      const brand = getBrandInfo(s.POLL_DIV_CD);
      // GIS_X_COOR/GIS_Y_COOR는 KATEC 좌표 (PDF 확인) → WGS84로 변환
      const wgs84 = katecToWgs84(s.GIS_X_COOR, s.GIS_Y_COOR);
      return {
        id: s.UNI_ID,
        name: s.OS_NM,
        brand: brand.label,
        brandCode: s.POLL_DIV_CD,
        brandColor: brand.color,
        price: Number(s.PRICE) || 0,
        distance: s.DISTANCE, // 단위: m (PDF 확인), StationCard의 formatDistance가 m 기준으로 처리
        address: s.NEW_ADR ?? s.VAN_ADR ?? s.ADDR ?? "",
        lat: wgs84.lat,
        lng: wgs84.lng,
      };
    });
    return NextResponse.json({ stations });
  } catch (e) {
    const msg = (e as Error).message;
    const error = msg === "OPINET_EMPTY_RESPONSE" ? "rate_limit" : "api_error";
    console.error("[around] Opinet error:", msg);
    return NextResponse.json({ stations: [], error });
  }
}
