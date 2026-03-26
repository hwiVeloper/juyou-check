# 주유췍 MVP 개발 계획

> 작성일: 2026-03-26
> 상태: 진행 중

## Context

Opinet API 키와 카카오맵 JavaScript 키가 준비된 상태에서 빠른 MVP 출시를 위한 개발 우선순위 정리.

**이미 구현된 것:**
- 프로젝트 세팅 (Next.js 16, React 19, TypeScript 5, Tailwind v4)
- `src/hooks/use-geolocation.ts` — 브라우저 Geolocation 훅
- `src/lib/utils.ts` — cn() 유틸리티
- `src/app/globals.css` — 전역 스타일 + 브랜드 컬러
- `src/app/layout.tsx` — 루트 레이아웃

**구현 필요:**
- API 라우트 8개 (Opinet 프록시)
- 4개 페이지 전체
- 공통 컴포넌트

---

## 개발 순서 (권장 순서)

### Phase 1 — API 레이어 구축

| # | 작업 | 경로 | 비고 |
|---|------|------|------|
| 1-1 | 좌표 변환 유틸리티 | `src/lib/coord-transform.ts` | WGS84 → KATEC (Opinet aroundAll 필수) |
| 1-2 | Opinet API 클라이언트 | `src/lib/opinet.ts` | fetch wrapper + 에러 처리 |
| 1-3 | 주변 주유소 검색 API | `src/app/api/gas/around/route.ts` | 위치 기반 P0 핵심 |
| 1-4 | 전국 평균가 API | `src/app/api/gas/avg-all/route.ts` | 1시간 캐시 |
| 1-5 | 시도별 평균가 API | `src/app/api/gas/avg-sido/route.ts` | 1시간 캐시 |
| 1-6 | 가격 동향(5일) API | `src/app/api/gas/trend/route.ts` | 대시보드용 |
| 1-7 | 최저가 TOP10 API | `src/app/api/gas/top10/route.ts` | 지역별 필터 |
| 1-8 | 주유소 상세 API | `src/app/api/gas/station/[id]/route.ts` | 6시간 캐시 |
| 1-9 | 시도/시군구 코드 API | `src/app/api/gas/codes/sido/route.ts` 외 | 코드 목록 |

### Phase 2 — 메인 페이지 `/` (P0)

| # | 작업 | 비고 |
|---|------|------|
| 2-1 | KakaoMap 컴포넌트 | `src/components/KakaoMap.tsx` — `'use client'`, 마커 |
| 2-2 | StationCard 컴포넌트 | 가격/거리/브랜드 표시 |
| 2-3 | BottomSheet 컴포넌트 | 드래그 확장, 목록 표시 |
| 2-4 | FuelFilter 컴포넌트 | 휘발유/경유/LPG/프리미엄 탭 |
| 2-5 | RadiusFilter 컴포넌트 | 1km/3km/5km 선택 |
| 2-6 | 메인 페이지 조립 | `src/app/page.tsx` 교체 |

### Phase 3 — 대시보드 `/dashboard` (P0)

| # | 작업 | 비고 |
|---|------|------|
| 3-1 | 전국 평균가 카드 | 유종별 현재가 |
| 3-2 | 5일 가격 동향 차트 | Recharts 활용 |
| 3-3 | 시도별 가격 테이블 | 지역 드롭다운 |
| 3-4 | 대시보드 페이지 조립 | `src/app/dashboard/page.tsx` |

### Phase 4 — TOP10 & 상세 (P1)

| # | 작업 | 비고 |
|---|------|------|
| 4-1 | TOP10 목록 페이지 | `src/app/top10/page.tsx` |
| 4-2 | 주유소 상세 페이지 | `src/app/station/[id]/page.tsx` |

### Phase 5 — 마무리

| # | 작업 | 비고 |
|---|------|------|
| 5-1 | 하단 탭 내비게이션 | `src/components/BottomNav.tsx` |
| 5-2 | 로딩 스켈레톤 UI | shimmer 효과 |
| 5-3 | 에러 바운더리 | error.tsx 처리 |
| 5-4 | 모바일 반응형 튜닝 | iOS safe-area |

---

## Shadcn 컴포넌트 설치

```bash
npx shadcn@latest add button card sheet tabs select badge skeleton
```

---

## 주요 환경변수

```env
OPINET_API_KEY=<서버사이드 전용>
NEXT_PUBLIC_KAKAO_MAP_KEY=<클라이언트 공개>
```

---

## 오피넷 API 엔드포인트

| 내부 API | Opinet 원본 | 캐시 |
|---------|------------|------|
| `/api/gas/around` | `aroundAll.do` | 없음 |
| `/api/gas/avg-all` | `avgAllPrice.do` | 1시간 |
| `/api/gas/avg-sido` | `avgSidoPrice.do` | 1시간 |
| `/api/gas/trend` | `oilDt5AvgPrice.do` | 1시간 |
| `/api/gas/top10` | `lowTop10.do` | 1시간 |
| `/api/gas/station/[id]` | `detailById.do` | 6시간 |

## 유종 코드

| 코드 | 유종 |
|------|------|
| `B027` | 휘발유 |
| `B034` | 고급휘발유 |
| `D047` | 경유 |
| `C004` | LPG |
| `K015` | 등유 |

---

## 개발 시작 핵심 루프

```
1-1 좌표 변환 → 1-2 Opinet 클라이언트 → 1-3 around API
→ 2-1 KakaoMap → 2-6 메인 페이지 조립
```

이 5개를 완성하면 "위치 감지 → API 호출 → 지도 표시" 핵심 루프가 동작함.
