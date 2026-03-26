import { NextRequest, NextResponse } from "next/server";
import { fetchStationDetail, getBrandInfo } from "@/lib/opinet";
import { katecToWgs84 } from "@/lib/coord-transform";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await fetchStationDetail(id);
  const raw = data.RESULT?.OIL?.[0];
  if (!raw) {
    return NextResponse.json({ error: "주유소를 찾을 수 없습니다." }, { status: 404 });
  }
  // 실제 Opinet 응답 필드명: POLL_DIV_CO, MAINT_YN, KPETRO_YN, GIS_X_COOR/GIS_Y_COOR
  const pollDivCode = raw.POLL_DIV_CO ?? raw.POLL_DIV_CD ?? "";
  const brand = getBrandInfo(pollDivCode);
  const station = {
    id,
    name: raw.OS_NM,
    brand: brand.label,
    brandCode: pollDivCode,
    brandColor: brand.color,
    address: raw.NEW_ADR ?? raw.VAN_ADR ?? "",
    tel: raw.TEL ?? "",
    // GIS_X_COOR/GIS_Y_COOR는 KATEC 좌표 (PDF 확인) → WGS84 변환
    // detailById.do 응답에는 LON/LAT 필드 없음 (PDF 기준)
    ...(() => {
      if (raw.GIS_X_COOR && raw.GIS_Y_COOR) {
        return katecToWgs84(raw.GIS_X_COOR, raw.GIS_Y_COOR);
      }
      return { lat: 0, lng: 0 };
    })(),
    services: {
      carWash: raw.CAR_WASH_YN === "Y",
      maintenance: raw.MAINT_YN === "Y",
      convenience: raw.CVS_YN === "Y",
      kiosk: raw.KPETRO_YN === "Y",
    },
    prices: (raw.OIL_PRICE ?? []).map((p) => ({
      code: p.PRODCD,
      name: p.PRODNM ?? p.PRODCD,
      price: Number(p.PRICE) || 0,
    })),
  };
  return NextResponse.json({ station }, {
    headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=300" },
  });
}
