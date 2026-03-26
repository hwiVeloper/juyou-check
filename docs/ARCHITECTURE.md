# 프로젝트 아키텍처

## 디렉토리 구조

```
juyou-check/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # 루트 레이아웃 (메타데이터, viewport, 폰트)
│   │   ├── globals.css             # 전역 스타일 (Tailwind v4 + shadcn CSS 변수)
│   │   ├── page.tsx                # 메인 페이지 (현재 위치 기반 검색)
│   │   ├── dashboard/
│   │   │   └── page.tsx            # 전국/지역 유가 현황 대시보드
│   │   ├── top10/
│   │   │   └── page.tsx            # 지역별 최저가 TOP 10
│   │   ├── station/
│   │   │   └── [id]/
│   │   │       └── page.tsx        # 주유소 상세 정보
│   │   └── api/
│   │       └── gas/                # 오피넷 API 프록시 (서버 전용)
│   │           ├── around/
│   │           │   └── route.ts    # 반경 내 주유소 조회
│   │           ├── avg-all/
│   │           │   └── route.ts    # 전국 평균가
│   │           ├── avg-sido/
│   │           │   └── route.ts    # 시도별 평균가
│   │           ├── avg-sigun/
│   │           │   └── route.ts    # 시군구별 평균가
│   │           ├── trend/
│   │           │   └── route.ts    # 최근 5일 추이
│   │           ├── top10/
│   │           │   └── route.ts    # 최저가 TOP 10
│   │           ├── station/
│   │           │   └── [id]/
│   │           │       └── route.ts # 주유소 상세
│   │           └── codes/
│   │               ├── sido/
│   │               │   └── route.ts # 시도 코드 목록
│   │               └── sigun/
│   │                   └── route.ts # 시군구 코드 목록
│   ├── components/
│   │   └── ui/                     # shadcn UI 컴포넌트 (npx shadcn add로 추가)
│   ├── hooks/
│   │   └── use-geolocation.ts      # 브라우저 Geolocation API 훅
│   └── lib/
│       └── utils.ts                # cn() 유틸리티 (clsx + tailwind-merge)
├── docs/
│   ├── PRD.md                      # 제품 요구사항 문서
│   ├── SETUP.md                    # 개발 환경 설정 가이드
│   └── ARCHITECTURE.md             # 이 파일
├── public/                         # 정적 자산
├── components.json                 # shadcn UI 설정
├── .env.local                      # 환경변수 (gitignore)
└── .env.example                    # 환경변수 예시 템플릿
```

---

## 데이터 흐름

```
브라우저
  │
  │  1. Geolocation API → WGS84 좌표(위도·경도)
  │  2. fetch('/api/gas/around?lat=...&lng=...&radius=3')
  ▼
Next.js API Route (서버)
  │
  │  3. WGS84 → KATEC 좌표 변환
  │  4. OPINET_API_KEY 첨부하여 오피넷 호출
  ▼
오피넷 Open API (외부)
  │
  │  5. 주유소 목록 + 가격 JSON 반환
  ▼
Next.js API Route (서버)
  │
  │  6. 데이터 가공 (거리 계산, 브랜드 매핑, 정렬)
  ▼
브라우저
  │
  │  7. 주유소 카드 렌더링
  │  8. 카카오맵 마커 표시
  ▼
사용자
```

> **API Key 보안**: `OPINET_API_KEY`는 서버 환경변수로만 관리되며 클라이언트 번들에 포함되지 않습니다.
> 클라이언트는 오직 `/api/gas/*` 엔드포인트만 호출합니다.

---

## 좌표계 변환

오피넷 `aroundAll` API는 **KATEC 좌표계**를 사용하며, 브라우저 Geolocation API는 **WGS84(위경도)**를 반환합니다.
변환은 `/api/gas/around` Route Handler 서버 코드에서 처리합니다.

| 항목 | 좌표계 | 출처 |
|------|--------|------|
| 브라우저 현재 위치 | WGS84 (위도·경도) | `navigator.geolocation` |
| 오피넷 aroundAll 입력 | KATEC (TM 중부원점) | 오피넷 API 스펙 |
| 카카오맵 마커 표시 | WGS84 (위도·경도) | 오피넷 응답값 중 `GIS_X_COOR`, `GIS_Y_COOR` |

---

## 캐싱 전략

| 엔드포인트 | 캐시 시간 | 이유 |
|-----------|----------|------|
| `/api/gas/avg-all` | 1시간 | 전국 평균가는 빠르게 변하지 않음 |
| `/api/gas/avg-sido` | 1시간 | 시도별 평균가 동일 |
| `/api/gas/avg-sigun` | 1시간 | 시군구 평균가 동일 |
| `/api/gas/trend` | 1시간 | 일별 데이터, 빈번한 갱신 불필요 |
| `/api/gas/top10` | 1시간 | 동일 |
| `/api/gas/around` | 캐시 없음 | 위치·반경에 따라 결과가 달라짐 |
| `/api/gas/station/[id]` | 6시간 | 주유소 상세는 자주 변하지 않음 |

> 오피넷 무료 API 일일 호출 한도: **1,500 call/일** — 캐싱 필수

---

## 모바일 레이아웃 구조

```
모바일 (< 768px)           태블릿·데스크탑 (≥ 768px)
┌──────────────────┐       ┌────────────┬────────────────┐
│ Header (48px 고정)│       │ GNB (헤더) │                │
├──────────────────┤       ├────────────┤                │
│                  │       │ 필터 패널  │   카카오맵      │
│   카카오맵        │       │            │                │
│  (화면 40%)      │       │ 주유소     │   [마커들]      │
├──────────────────┤       │ 카드 목록  │                │
│ ━━ 바텀시트 ━━━  │       │  (스크롤)  │                │
│ [유종 탭]         │       └────────────┴────────────────┘
│ 주유소 카드 목록  │       │ Footer (데이터 출처)         │
├──────────────────┤       └─────────────────────────────┘
│ 하단 탭바 (56px) │
└──────────────────┘
```

---

## shadcn UI 설정

`components.json` 기준:

| 설정 | 값 |
|------|----|
| style | `default` |
| baseColor | `slate` |
| CSS 변수 | 사용 (`cssVariables: true`) |
| RSC | 활성화 |
| 아이콘 | `lucide` |
| 컴포넌트 경로 | `@/components/ui` |
| 유틸리티 경로 | `@/lib/utils` |
| 훅 경로 | `@/hooks` |

### 브랜드 컬러

`globals.css`에 커스텀 CSS 변수로 등록됨:

```css
--brand: oklch(0.705 0.191 49.6); /* #F97316 주황 */
```

Tailwind 클래스: `bg-brand`, `text-brand`, `border-brand`

---

## 오피넷 API 요약

| API | 엔드포인트 | 좌표계 |
|-----|-----------|--------|
| 전국 평균가 | `avgAllPrice.do` | - |
| 시도별 평균가 | `avgSidoPrice.do` | - |
| 시군구별 평균가 | `avgSigunPrice.do` | - |
| 5일 추이 | `oilDt5AvgPrice.do` | - |
| 반경 주유소 | `aroundAll.do` | KATEC 입력 |
| 최저가 TOP10 | `lowTop10.do` | - |
| 주유소 상세 | `detailById.do` | - |

유종 코드: `B027`(휘발유) / `B034`(고급휘발유) / `D047`(경유) / `C004`(LPG) / `K015`(등유)
