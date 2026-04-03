# 주유췤 (Juyou-Check)

실시간 주변 주유소 가격 비교 서비스. 현재 위치 기반으로 가장 저렴한 주유소를 찾고, 전국 유가 동향을 한눈에 확인하세요.

---

## 주요 기능

- **위치 기반 주유소 검색**: 현재 위치에서 반경 1~5km 내 주유소를 가격순/거리순으로 조회
- **카카오맵 연동**: 주유소 위치를 지도에서 확인하고 마커 클릭으로 상세 정보 접근
- **유가 대시보드**: 전국·시도별 평균 유가 및 5일 가격 추세 차트
- **전국 TOP 10**: 지역별 최저가 주유소 순위
- **즐겨찾기 / 방문 기록**: 자주 가는 주유소를 저장하고 방문 이력 관리
- **저장된 위치**: 집, 직장 등 자주 쓰는 위치를 등록해 빠르게 검색
- **브랜드 필터**: 특정 브랜드만 필터링해서 조회
- **다크 모드**: 라이트/다크 테마 전환 지원
- **공유**: 주유소 정보를 네이티브 공유 또는 클립보드 복사

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn UI + Radix UI |
| 아이콘 | Lucide React |
| 지도 | Kakao Maps SDK (react-kakao-maps-sdk) |
| 폼 | React Hook Form + Zod |
| 외부 API | 오피넷(한국석유공사) Open API |

---

## 시작하기

### 사전 요구사항

- Node.js 20+
- 오피넷 Open API 키 ([신청](https://www.opinet.co.kr) → 오픈API 이용신청)
- 카카오 JavaScript API 키 ([발급](https://developers.kakao.com) → 내 애플리케이션)

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/juyou-check.git
cd juyou-check

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 API 키 입력

# 개발 서버 시작 (Turbopack, port 3000)
npm run dev
```

### 환경 변수

```env
# 오피넷 API 키 (서버 전용)
OPINET_API_KEY=your_api_key_here

# 카카오맵 JavaScript API 키 (클라이언트 공개)
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_key_here
```

> **보안**: `OPINET_API_KEY`는 서버 환경 변수로만 사용되며 클라이언트 번들에 노출되지 않습니다.

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                  # 메인 페이지 (위치 기반 검색)
│   ├── dashboard/page.tsx        # 유가 대시보드
│   ├── top10/page.tsx            # 전국 TOP 10
│   ├── station/[id]/page.tsx     # 주유소 상세
│   └── api/gas/                  # 오피넷 API 프록시 라우트
│       ├── around/               # 주변 주유소 조회
│       ├── avg-all/              # 전국 평균 유가
│       ├── avg-sido/             # 시도별 평균
│       ├── avg-sigun/            # 시군구별 평균
│       ├── trend/                # 5일 가격 추세
│       ├── top10/                # 최저가 TOP 10
│       └── station/[id]/         # 주유소 상세 정보
├── components/
│   ├── KakaoMap.tsx              # 카카오맵 컴포넌트
│   ├── StationCard.tsx           # 주유소 카드
│   ├── BottomSheet.tsx           # 모바일 바텀시트
│   ├── BottomNav.tsx             # 하단 내비게이션
│   ├── FuelFilter.tsx            # 유종 선택
│   ├── RadiusFilter.tsx          # 검색 반경 슬라이더
│   ├── BrandFilter.tsx           # 브랜드 필터
│   ├── SortToggle.tsx            # 정렬 방식
│   └── ThemeToggle.tsx           # 다크/라이트 전환
├── hooks/
│   ├── use-geolocation.ts        # 브라우저 위치 정보
│   ├── useFavorites.ts           # 즐겨찾기 (localStorage)
│   ├── useVisitHistory.ts        # 방문 기록 (localStorage)
│   └── useSavedLocations.ts      # 저장된 위치 (localStorage)
└── lib/
    ├── opinet.ts                 # 오피넷 API 클라이언트
    ├── coord-transform.ts        # WGS84 ↔ KATEC 좌표 변환
    └── utils.ts                  # 공통 유틸리티
```

---

## 좌표 변환

오피넷 `aroundAll` API는 **KATEC** 좌표를 요구하지만 브라우저 Geolocation API는 **WGS84** 좌표를 반환합니다. `src/lib/coord-transform.ts`에서 Bessel 1841 타원체 + Helmert 3-파라미터 데이텀 변환을 통해 정밀한 좌표 변환을 수행합니다.

```
브라우저 (WGS84)
  → Next.js API Route (KATEC 변환 + API 키 주입)
  → 오피넷 API
  → Next.js API Route (WGS84 역변환 + 거리 계산)
  → 클라이언트 (카카오맵 표시)
```

---

## API 캐싱

오피넷 무료 플랜은 **1,500 calls/일** 제한이 있습니다. 각 API 라우트에 캐싱이 적용되어 있습니다.

| 엔드포인트 | 캐시 | 이유 |
|-----------|------|------|
| 전국/시도/시군구 평균, 추세, TOP 10 | 1시간 | 가격 변동 주기 느림 |
| 주유소 상세 | 6시간 | 정보 변경 빈도 낮음 |
| 주변 주유소 | 없음 | 위치·반경에 따라 결과 상이 |

---

## 지원 유종

| 코드 | 유종 |
|------|------|
| B027 | 휘발유 |
| B034 | 고급 휘발유 |
| D047 | 경유 |
| C004 | LPG |

---

## NPM 스크립트

```bash
npm run dev      # 개발 서버 (Turbopack)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 검사
```

---

## 문서

- [`docs/PRD.md`](docs/PRD.md) — 제품 요구사항
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 시스템 설계 및 데이터 흐름
- [`docs/SETUP.md`](docs/SETUP.md) — 개발 환경 설정 (프록시, SSL)

---

## 브라우저 지원

Geolocation API 사용을 위해 **HTTPS 환경**이 필요합니다.

- Chrome / Edge 111+
- Firefox 111+
- iOS Safari 16.4+
- Android Chrome 111+

---

## 라이선스

MIT
