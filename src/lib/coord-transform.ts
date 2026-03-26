/**
 * WGS84 (위경도) ↔ KATEC (TM 중부원점) 좌표 변환
 * 오피넷 aroundAll.do API는 KATEC 좌표계를 사용합니다.
 *
 * ⚠️ 중요: 오피넷 KATEC는 전통적인 한국 좌표계로 Bessel 1841 타원체 기반입니다.
 * WGS84 카카오맵 좌표로 변환 시 아래 두 단계가 필요합니다.
 *
 *  1단계: KATEC ↔ Bessel 1841 경위도 (TM 투영/역투영)
 *  2단계: Bessel 1841 ↔ WGS84 (Helmert 3-파라미터 데이텀 변환)
 *
 * KATEC TM 파라미터:
 *   타원체: Bessel 1841 (a=6377397.155, f=1/299.1528128)
 *   중부원점 경도: 128°E
 *   중부원점 위도: 38°N
 *   축척계수: 1.0
 *   False Easting: 400,000m
 *   False Northing: 600,000m
 *
 * Helmert 변환 (한국측지계 → WGS84):
 *   출처: 국토지리정보원 (NGII) — Tokyo Datum / Bessel 1841 → WGS84 (한반도)
 *   ΔX = -146.43m, ΔY = 507.34m, ΔZ = 680.68m
 */

const DEG_TO_RAD = Math.PI / 180;

// ─── Bessel 1841 타원체 파라미터 (전통 한국 KATEC 기준) ──────────────────────
const A = 6377397.155;           // 장반경 (m)
const F = 1 / 299.1528128;       // 편평률의 역수
const E2 = 2 * F - F * F;        // 제1 이심률²
const E4 = E2 * E2;
const E6 = E4 * E2;

// ─── WGS84 타원체 파라미터 (카카오맵 기준) ───────────────────────────────────
const A_WGS = 6378137.0;
const F_WGS = 1 / 298.257223563;
const E2_WGS = 2 * F_WGS - F_WGS * F_WGS;

// ─── KATEC TM 투영 파라미터 ──────────────────────────────────────────────────
const K0 = 1.0;
const LON0 = 128.0 * DEG_TO_RAD;  // 중부원점 경도 128°E
const LAT0 = 38.0 * DEG_TO_RAD;   // 중부원점 위도 38°N
const FE = 400000;                  // False Easting
const FN = 600000;                  // False Northing

// ─── 한국측지계 → WGS84 Helmert 3-파라미터 ──────────────────────────────────
const HELMERT_DX = -146.43;  // m
const HELMERT_DY =  507.34;  // m
const HELMERT_DZ =  680.68;  // m

// ─── 자오선 호장 (Bessel 1841 기준) ─────────────────────────────────────────
function meridianArc(lat: number): number {
  return A * (
    (1 - E2 / 4 - (3 * E4) / 64 - (5 * E6) / 256) * lat
    - ((3 * E2) / 8 + (3 * E4) / 32 + (45 * E6) / 1024) * Math.sin(2 * lat)
    + ((15 * E4) / 256 + (45 * E6) / 1024) * Math.sin(4 * lat)
    - ((35 * E6) / 3072) * Math.sin(6 * lat)
  );
}

// ─── 데이텀 변환 ─────────────────────────────────────────────────────────────

/**
 * Bessel 1841 경위도(라디안) → WGS84 경위도(라디안)
 * ECEF 경유 Helmert 3-파라미터 변환
 */
function besselToWgs84Rad(
  phi: number,
  lam: number,
): { phi: number; lam: number } {
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const nu = A / Math.sqrt(1 - E2 * sinPhi * sinPhi);

  // Bessel 경위도 → ECEF
  const X = nu * cosPhi * Math.cos(lam);
  const Y = nu * cosPhi * Math.sin(lam);
  const Z = nu * (1 - E2) * sinPhi;

  // Helmert shift: 한국측지계 → WGS84
  const Xw = X + HELMERT_DX;
  const Yw = Y + HELMERT_DY;
  const Zw = Z + HELMERT_DZ;

  // ECEF → WGS84 경위도 (Bowring 반복법)
  const p = Math.sqrt(Xw * Xw + Yw * Yw);
  const lamW = Math.atan2(Yw, Xw);
  let phiW = Math.atan2(Zw, p * (1 - E2_WGS));
  for (let i = 0; i < 10; i++) {
    const s = Math.sin(phiW);
    const nuW = A_WGS / Math.sqrt(1 - E2_WGS * s * s);
    phiW = Math.atan2(Zw + E2_WGS * nuW * s, p);
  }

  return { phi: phiW, lam: lamW };
}

/**
 * WGS84 경위도(라디안) → Bessel 1841 경위도(라디안)
 * ECEF 경유 역 Helmert 3-파라미터 변환
 */
function wgs84TobesselRad(
  phi: number,
  lam: number,
): { phi: number; lam: number } {
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const nuW = A_WGS / Math.sqrt(1 - E2_WGS * sinPhi * sinPhi);

  // WGS84 경위도 → ECEF
  const Xw = nuW * cosPhi * Math.cos(lam);
  const Yw = nuW * cosPhi * Math.sin(lam);
  const Zw = nuW * (1 - E2_WGS) * sinPhi;

  // 역 Helmert shift: WGS84 → 한국측지계
  const X = Xw - HELMERT_DX;
  const Y = Yw - HELMERT_DY;
  const Z = Zw - HELMERT_DZ;

  // ECEF → Bessel 경위도 (Bowring 반복법)
  const p = Math.sqrt(X * X + Y * Y);
  const lamB = Math.atan2(Y, X);
  let phiB = Math.atan2(Z, p * (1 - E2));
  for (let i = 0; i < 10; i++) {
    const s = Math.sin(phiB);
    const nuB = A / Math.sqrt(1 - E2 * s * s);
    phiB = Math.atan2(Z + E2 * nuB * s, p);
  }

  return { phi: phiB, lam: lamB };
}

// ─── 공개 인터페이스 ──────────────────────────────────────────────────────────

export interface KatecCoord {
  x: number; // Easting  (m)
  y: number; // Northing (m)
}

export interface Wgs84Coord {
  lat: number;
  lng: number;
}

/**
 * KATEC(TM 중부원점) 좌표 → WGS84 경위도
 * 오피넷 GIS_X_COOR(x=Easting), GIS_Y_COOR(y=Northing) → 카카오맵 lat/lng
 *
 * 변환 순서: KATEC → Bessel 1841 경위도 → WGS84 경위도
 */
export function katecToWgs84(x: number, y: number): Wgs84Coord {
  const x1 = x - FE;
  const y1 = y - FN;

  // ── 역투영: KATEC → Bessel 1841 경위도 ──────────────────────────────────
  const M1 = y1 / K0 + meridianArc(LAT0);

  const sqrtTerm = Math.sqrt(1 - E2);
  const e1 = (1 - sqrtTerm) / (1 + sqrtTerm);

  const mu = M1 / (A * (1 - E2 / 4 - (3 * E4) / 64 - (5 * E6) / 256));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * Math.pow(e1, 4)) / 32) * Math.sin(4 * mu) +
    ((151 * Math.pow(e1, 3)) / 96) * Math.sin(6 * mu) +
    ((1097 * Math.pow(e1, 4)) / 512) * Math.sin(8 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);
  const ep2 = E2 / (1 - E2);  // e'²

  const nu1   = A / Math.sqrt(1 - E2 * sinPhi1 * sinPhi1);
  const rho1  = (A * (1 - E2)) / Math.pow(1 - E2 * sinPhi1 * sinPhi1, 1.5);
  const T1    = tanPhi1 * tanPhi1;
  const C1    = ep2 * cosPhi1 * cosPhi1;
  const D     = x1 / (nu1 * K0);

  const phi_bes =
    phi1 -
    (nu1 * tanPhi1 / rho1) * (
      D * D / 2 -
      (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * Math.pow(D, 4) / 24 +
      (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * Math.pow(D, 6) / 720
    );

  const lam_bes =
    LON0 +
    (
      D -
      (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 +
      (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * Math.pow(D, 5) / 120
    ) / cosPhi1;

  // ── 데이텀 변환: Bessel 1841 → WGS84 ────────────────────────────────────
  const wgs = besselToWgs84Rad(phi_bes, lam_bes);

  return {
    lat: wgs.phi / DEG_TO_RAD,
    lng: wgs.lam / DEG_TO_RAD,
  };
}

/**
 * WGS84 경위도 → KATEC(TM 중부원점) 좌표
 * 사용자 위치(카카오맵 lat/lng) → 오피넷 aroundAll.do x/y 파라미터
 *
 * 변환 순서: WGS84 경위도 → Bessel 1841 경위도 → KATEC
 */
export function wgs84ToKatec(lat: number, lng: number): KatecCoord {
  // ── 데이텀 변환: WGS84 → Bessel 1841 ────────────────────────────────────
  const b = wgs84TobesselRad(lat * DEG_TO_RAD, lng * DEG_TO_RAD);
  const phi = b.phi;
  const lam = b.lam;

  // ── 정투영: Bessel 1841 경위도 → KATEC ──────────────────────────────────
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);
  const ep2 = E2 / (1 - E2);  // e'²

  const nu  = A / Math.sqrt(1 - E2 * sinPhi * sinPhi);
  const T   = tanPhi * tanPhi;
  const C   = ep2 * cosPhi * cosPhi;
  const A_  = cosPhi * (lam - LON0);
  const M   = meridianArc(phi);
  const M0  = meridianArc(LAT0);

  const x =
    FE +
    K0 * nu * (
      A_ +
      (1 - T + C) * Math.pow(A_, 3) / 6 +
      (5 - 18 * T + T * T + 72 * C - 58 * ep2) * Math.pow(A_, 5) / 120
    );

  const y =
    FN +
    K0 * (
      (M - M0) +
      nu * tanPhi * (
        A_ * A_ / 2 +
        (5 - T + 9 * C + 4 * C * C) * Math.pow(A_, 4) / 24 +
        (61 - 58 * T + T * T + 600 * C - 330 * ep2) * Math.pow(A_, 6) / 720
      )
    );

  return { x: Math.round(x), y: Math.round(y) };
}
