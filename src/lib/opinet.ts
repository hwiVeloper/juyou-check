/**
 * 오피넷 Open API 클라이언트
 * 서버 전용 모듈 — 클라이언트 번들에 포함되지 않습니다.
 *
 * 오피넷 API는 HTTP만 지원하므로 반드시 서버(API Route)에서 호출해야 합니다.
 * 일일 호출 제한: 1,500 call/일 (무료)
 */

const OPINET_BASE_URL = "http://www.opinet.co.kr/api";

export type FuelCode = "B027" | "B034" | "D047" | "C004" | "K015";

export const FUEL_LABELS: Record<FuelCode, string> = {
  B027: "휘발유",
  B034: "고급휘발유",
  D047: "경유",
  C004: "LPG",
  K015: "등유",
};

/** 오피넷 API 공통 파라미터 빌더 */
function buildParams(
  extra: Record<string, string | number> = {}
): URLSearchParams {
  const apiKey = process.env.OPINET_API_KEY;
  if (!apiKey) throw new Error("OPINET_API_KEY 환경변수가 설정되지 않았습니다.");
  return new URLSearchParams({
    code: apiKey,
    out: "json",
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])),
  });
}

/** 오피넷 API fetch 래퍼 */
async function opinetFetch<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const url = `${OPINET_BASE_URL}/${endpoint}?${buildParams(params)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`오피넷 API 오류: ${res.status} ${endpoint}`);
  }
  const text = await res.text();
  if (!text || !text.trim()) {
    // 빈 응답 — 일일 호출 한도 초과 또는 일시적 오류
    console.warn(`[opinet] Empty response from ${endpoint} — rate limit or server error`);
    throw new Error("OPINET_EMPTY_RESPONSE");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error(`[opinet] JSON 파싱 실패 (${endpoint}):`, text.slice(0, 200));
    throw new Error("OPINET_PARSE_ERROR");
  }
}

// ─── 응답 타입 정의 ───────────────────────────────────────────────────────────

export interface OpinetAvgPrice {
  PRODCD: FuelCode;
  PRODNM: string;
  PRICE: number;
  DIFF: number;
}

export interface OpinetAvgAllResponse {
  RESULT: {
    OIL: OpinetAvgPrice[];
  };
}

export interface OpinetSidoPrice {
  SIDONM: string;
  SIDOCD: string;
  PRICE: number;
}

export interface OpinetAvgSidoResponse {
  RESULT: {
    OIL: OpinetSidoPrice[];
  };
}

export interface OpinetSigunPrice {
  SIGUNNM: string;  // PDF 기준 실제 필드명 (SIGUNM 아님)
  SIGUNCD: string;
  PRICE: number;
}

export interface OpinetAvgSigunResponse {
  RESULT: {
    OIL: OpinetSigunPrice[];
  };
}

export interface OpinetTrendItem {
  TRADE_DT: string;
  PRICE: number;
}

export interface OpinetTrendResponse {
  RESULT: {
    OIL: OpinetTrendItem[];
  };
}

export interface OpinetAroundStation {
  UNI_ID: string;
  OS_NM: string;
  POLL_DIV_CD: string;
  GIS_X_COOR: number;
  GIS_Y_COOR: number;
  DISTANCE: number;
  PRICE: number | string;
  ADDR: string;
  VAN_ADR?: string;
  NEW_ADR?: string;
}

export interface OpinetAroundResponse {
  RESULT: {
    OIL: OpinetAroundStation[];
  };
}

export interface OpinetTop10Station {
  UNI_ID: string;
  OS_NM: string;
  POLL_DIV_CD: string;
  PRICE: number | string;
  ADDR?: string;
  VAN_ADR?: string;
  NEW_ADR?: string;
  GIS_X_COOR: number;
  GIS_Y_COOR: number;
}

export interface OpinetTop10Response {
  RESULT: {
    OIL: OpinetTop10Station[];
  };
}

export interface OpinetStationDetail {
  UNI_ID: string;
  OS_NM: string;
  POLL_DIV_CD?: string;  // aroundAll 응답
  POLL_DIV_CO?: string;  // detailById 응답 (실제 필드명)
  POLL_DIV_NM?: string;
  ADDR?: string;
  VAN_ADR?: string;
  NEW_ADR?: string;
  TEL?: string;
  LON?: number;       // 일부 응답
  LAT?: number;       // 일부 응답
  GIS_X_COOR?: number; // detailById 실제 응답
  GIS_Y_COOR?: number; // detailById 실제 응답
  MEND_YN?: string;
  MAINT_YN?: string;  // detailById 실제 필드명
  CAR_WASH_YN?: string;
  CVS_YN?: string;
  KIOSK_YN?: string;
  KPETRO_YN?: string; // detailById 실제 필드명
  OIL_PRICE?: Array<{ PRODCD: FuelCode; PRODNM?: string; PRICE: number | string }>;
}

export interface OpinetDetailResponse {
  RESULT: {
    OIL: OpinetStationDetail[];
  };
}

/** areaCode.do 응답 — 시도/시군구 통합 코드 */
export interface OpinetAreaCode {
  AREA_CD: string;  // 시도 2자리 또는 시군구 4자리
  AREA_NM: string;
}

export interface OpinetAreaResponse {
  RESULT: {
    OIL: OpinetAreaCode[];
  };
}

// 하위 호환용 alias
export type OpinetSidoCode = OpinetAreaCode;
export type OpinetSidoResponse = OpinetAreaResponse;
export type OpinetSigunCode = OpinetAreaCode;
export type OpinetSigunResponse = OpinetAreaResponse;

// ─── API 호출 함수 ──────────────────────────────────────────────────────────

/** 전국 유종별 평균 유가 */
export async function fetchAvgAllPrice(
  prodcd: FuelCode = "B027"
): Promise<OpinetAvgAllResponse> {
  return opinetFetch<OpinetAvgAllResponse>("avgAllPrice.do", { prodcd });
}

/** 시도별 평균 유가 */
export async function fetchAvgSidoPrice(
  prodcd: FuelCode = "B027"
): Promise<OpinetAvgSidoResponse> {
  return opinetFetch<OpinetAvgSidoResponse>("avgSidoPrice.do", { prodcd });
}

/** 시군구별 평균 유가 */
export async function fetchAvgSigunPrice(
  prodcd: FuelCode = "B027",
  sidocd: string
): Promise<OpinetAvgSigunResponse> {
  return opinetFetch<OpinetAvgSigunResponse>("avgSigunPrice.do", {
    prodcd,
    sidocd,
  });
}

/** 최근 5일 전국 평균가 추이 */
export async function fetchTrend(
  prodcd: FuelCode = "B027"
): Promise<OpinetTrendResponse> {
  return opinetFetch<OpinetTrendResponse>("oilDt5AvgPrice.do", { prodcd });
}

/** 반경 내 주유소 목록 (KATEC 좌표 입력)
 *  radius: km 단위로 전달 → 내부에서 m로 변환 (API 단위: m, 최대 5000m=5km)
 */
export async function fetchAroundStations(
  x: number,    // KATEC X (Easting)
  y: number,    // KATEC Y (Northing)
  radius: number, // UI 단위 km (1~5) — API 전송 시 * 1000 하여 m로 변환
  prodcd: FuelCode = "B027",
  sort: 1 | 2 = 1 // 1=가격순, 2=거리순
): Promise<OpinetAroundResponse> {
  return opinetFetch<OpinetAroundResponse>("aroundAll.do", {
    x,
    y,
    radius: radius * 1000, // km → m 변환 (PDF: 단위 m, 최대 5000)
    prodcd,
    sort,
  });
}

/** 최저가 TOP10 주유소
 *  area: PDF 기준 파라미터명 (이전 코드의 sido는 오류)
 *    - 미전달: 전국
 *    - 2자리: 시도 (ex: "01" = 서울)
 *    - 4자리: 시군구 (ex: "0101" = 서울 종로구)
 *  cnt: 조회건수 (기본 10, 최대 20)
 */
export async function fetchTop10(
  prodcd: FuelCode = "B027",
  area?: string,   // 전국=미전달, 시도=2자리, 시군구=4자리
  cnt: number = 10
): Promise<OpinetTop10Response> {
  const params: Record<string, string | number> = { prodcd, cnt };
  if (area) params.area = area;  // 전국일 때는 area 파라미터 전송하지 않음
  return opinetFetch<OpinetTop10Response>("lowTop10.do", params);
}

/** 주유소 상세 정보 */
export async function fetchStationDetail(
  uniId: string
): Promise<OpinetDetailResponse> {
  return opinetFetch<OpinetDetailResponse>("detailById.do", { id: uniId });
}

/** 시도 코드 목록 — areaCode.do (area 파라미터 없음 → 시도 목록 반환) */
export async function fetchSidoCodes(): Promise<OpinetAreaResponse> {
  return opinetFetch<OpinetAreaResponse>("areaCode.do", {});
}

/** 시군구 코드 목록 — areaCode.do?area={시도코드} */
export async function fetchSigunCodes(
  sidocd: string
): Promise<OpinetAreaResponse> {
  return opinetFetch<OpinetAreaResponse>("areaCode.do", { area: sidocd });
}

// ─── 브랜드 매핑 유틸 ────────────────────────────────────────────────────────

export const BRAND_MAP: Record<string, { label: string; color: string }> = {
  SKE: { label: "SK에너지", color: "bg-red-500" },
  GSC: { label: "GS칼텍스", color: "bg-blue-600" },
  HDO: { label: "현대오일뱅크", color: "bg-blue-400" },
  SOL: { label: "S-OIL", color: "bg-yellow-500" },
  RTE: { label: "알뜰(도로공사)", color: "bg-green-600" },
  RTX: { label: "알뜰(ex)", color: "bg-green-600" },
  NHO: { label: "농협(NH)", color: "bg-green-500" },
  ETC: { label: "자가브랜드", color: "bg-gray-400" },
  E1G: { label: "E1(LPG)", color: "bg-orange-400" },
  SKG: { label: "SK가스(LPG)", color: "bg-red-400" },
};

export function getBrandInfo(code: string) {
  return BRAND_MAP[code] ?? { label: code, color: "bg-gray-400" };
}
