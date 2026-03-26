import { NextRequest, NextResponse } from "next/server";
import { fetchStationDetail, getBrandInfo } from "@/lib/opinet";

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
    lat: raw.GIS_Y_COOR ?? raw.LAT ?? 0,
    lng: raw.GIS_X_COOR ?? raw.LON ?? 0,
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
