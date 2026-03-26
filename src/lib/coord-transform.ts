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
