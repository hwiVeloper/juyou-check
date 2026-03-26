/**
 * WGS84 (위경도) → KATEC (GRS80 기반 TM 중부원점) 좌표 변환
 * 오피넷 aroundAll.do API는 KATEC 좌표계를 사용합니다.
 *
 * WGS84와 GRS80는 실질적으로 동일한 타원체이므로
 * 별도의 datum 변환 없이 TM 투영만 수행합니다.
 *
 * KATEC TM 파라미터:
 *   타원체: GRS80 (a=6378137, f=1/298.257222101)
 *   중부원점 경도: 128°E
 *   중부원점 위도: 38°N
 *   축척계수: 1.0
 *   False Easting: 400,000m
 *   False Northing: 600,000m
 */

const DEG_TO_RAD = Math.PI / 180;

// GRS80 타원체 파라미터 (WGS84와 동일 타원체)
const A = 6378137.0;
const F = 1 / 298.257222101;
const E2 = 2 * F - F * F;   // 제1 이심률 제곱
const E4 = E2 * E2;
const E6 = E4 * E2;

// KATEC TM 투영 파라미터
const K0 = 1.0;              // 축척계수
const LON0 = 128.0 * DEG_TO_RAD; // 중부원점 경도 (128°E)
const LAT0 = 38.0 * DEG_TO_RAD;  // 중부원점 위도 (38°N)
const FE = 400000;           // False Easting
const FN = 600000;           // False Northing

/** 자오선 호장 계산 */
function meridianArc(lat: number): number {
  return A * (
    (1 - E2 / 4 - (3 * E4) / 64 - (5 * E6) / 256) * lat
    - ((3 * E2) / 8 + (3 * E4) / 32 + (45 * E6) / 1024) * Math.sin(2 * lat)
    + ((15 * E4) / 256 + (45 * E6) / 1024) * Math.sin(4 * lat)
    - ((35 * E6) / 3072) * Math.sin(6 * lat)
  );
}

export interface KatecCoord {
  x: number; // Easting
  y: number; // Northing
}

/**
 * WGS84 경위도를 KATEC(TM 중부원점) 좌표로 변환합니다.
 * @param lat WGS84 위도 (도)
 * @param lng WGS84 경도 (도)
 * @returns KATEC 좌표 { x, y } (미터, 소수점 없이 반올림)
 */
export interface Wgs84Coord {
  lat: number;
  lng: number;
}

/**
 * KATEC(TM 중부원점) 좌표를 WGS84 경위도로 역변환합니다.
 * Opinet 응답의 GIS_X_COOR(X=Easting), GIS_Y_COOR(Y=Northing)를 지도용 lat/lng로 변환할 때 사용.
 */
export function katecToWgs84(x: number, y: number): Wgs84Coord {
  const x1 = x - FE;
  const y1 = y - FN;

  const M1 = y1 / K0 + meridianArc(LAT0);

  // e1 파라미터
  const sqrtTerm = Math.sqrt(1 - E2);
  const e1 = (1 - sqrtTerm) / (1 + sqrtTerm);

  // 발 위도(footprint latitude)
  const mu = M1 / (A * (1 - E2 / 4 - (3 * E4) / 64 - (5 * E6) / 256));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 * e1 * e1) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * Math.pow(e1, 4)) / 32) * Math.sin(4 * mu) +
    ((151 * e1 * e1 * e1) / 96) * Math.sin(6 * mu) +
    ((1097 * Math.pow(e1, 4)) / 512) * Math.sin(8 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);

  const nu1 = A / Math.sqrt(1 - E2 * sinPhi1 * sinPhi1);
  const rho1 = (A * (1 - E2)) / Math.pow(1 - E2 * sinPhi1 * sinPhi1, 1.5);
  const T1 = tanPhi1 * tanPhi1;
  const C1 = (E2 / (1 - E2)) * cosPhi1 * cosPhi1;
  const D = x1 / (nu1 * K0);

  const phi =
    phi1 -
    (nu1 * tanPhi1 / rho1) * (
      (D * D) / 2 -
      (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * (E2 / (1 - E2))) * Math.pow(D, 4) / 24 +
      (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * (E2 / (1 - E2)) - 3 * C1 * C1) * Math.pow(D, 6) / 720
    );

  const lam =
    LON0 +
    (D -
      (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 +
      (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * (E2 / (1 - E2)) + 24 * T1 * T1) * Math.pow(D, 5) / 120
    ) / cosPhi1;

  return {
    lat: phi / DEG_TO_RAD,
    lng: lam / DEG_TO_RAD,
  };
}

export function wgs84ToKatec(lat: number, lng: number): KatecCoord {
  const phi = lat * DEG_TO_RAD;
  const lam = lng * DEG_TO_RAD;

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const nu = A / Math.sqrt(1 - E2 * sinPhi * sinPhi); // 묘유선 곡률반경
  const T = tanPhi * tanPhi;
  const C = (E2 / (1 - E2)) * cosPhi * cosPhi;        // e'²cos²φ
  const A_ = cosPhi * (lam - LON0);                   // (λ - λ₀)cosφ

  const M = meridianArc(phi);
  const M0 = meridianArc(LAT0);

  const x =
    FE +
    K0 * nu * (
      A_
      + (1 - T + C) * Math.pow(A_, 3) / 6
      + (5 - 18 * T + T * T + 72 * C - 58 * (E2 / (1 - E2))) * Math.pow(A_, 5) / 120
    );

  const y =
    FN +
    K0 * (
      (M - M0) +
      nu * tanPhi * (
        A_ * A_ / 2
        + (5 - T + 9 * C + 4 * C * C) * Math.pow(A_, 4) / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * (E2 / (1 - E2))) * Math.pow(A_, 6) / 720
      )
    );

  return { x: Math.round(x), y: Math.round(y) };
}
