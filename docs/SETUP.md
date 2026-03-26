# 개발 환경 설정 가이드

## 시스템 요구사항

| 항목 | 버전 |
|------|------|
| Node.js | 20.9 이상 |
| npm | 10 이상 |
| OS | macOS / Windows (WSL 포함) / Linux |

---

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (아래 섹션 참고)
cp .env.example .env.local

# 3. 개발 서버 실행
npm run dev
```

> 브라우저에서 http://localhost:3000 접속

---

## 환경변수 설정

`.env.local` 파일을 루트에 생성하고 아래 변수를 입력합니다.

```env
# 오피넷 Open API 키
# 발급: https://www.opinet.co.kr → 회원가입 → 오픈API 신청
# 일일 1,500 call 무료 제공
OPINET_API_KEY=여기에_오피넷_API_키_입력

# 카카오맵 JavaScript API 키
# 발급: https://developers.kakao.com → 내 애플리케이션 → 앱 키 → JavaScript 키
NEXT_PUBLIC_KAKAO_MAP_KEY=여기에_카카오맵_API_키_입력
```

> ⚠️ `.env.local`은 `.gitignore`에 포함되어 있어 커밋되지 않습니다.

---

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.2.1 |
| 언어 | TypeScript | ^5 |
| UI 컴포넌트 | Shadcn UI | latest |
| 스타일링 | Tailwind CSS | ^4 |
| 아이콘 | Lucide React | (shadcn 내장) |
| 폼 관리 | React Hook Form | latest |
| 스키마 검증 | Zod | latest |
| 지도 | Kakao Maps JavaScript SDK | - |
| 외부 API | 오피넷 Open API | - |

---

## 주요 npm 스크립트

```bash
npm run dev      # 개발 서버 실행 (Turbopack, localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 검사
```

---

## Shadcn UI 컴포넌트 추가

프로젝트는 Shadcn UI를 사용합니다. 컴포넌트는 필요할 때 개별로 추가합니다.

```bash
# 예시: 버튼 컴포넌트 추가
npx shadcn@latest add button

# 예시: 여러 컴포넌트 한 번에 추가
npx shadcn@latest add card sheet select tabs badge
```

추가된 컴포넌트는 `src/components/ui/` 디렉토리에 생성됩니다.

### 이 프로젝트에서 사용 예정인 컴포넌트

| 컴포넌트 | 용도 |
|----------|------|
| `button` | 범용 버튼 |
| `card` | 주유소 카드 |
| `sheet` | 바텀시트 (모바일 필터, 상세) |
| `tabs` | 유종 탭 (휘발유/경유/LPG) |
| `select` | 시도·시군구 드롭다운 |
| `badge` | 브랜드 배지, 가격 상태 |
| `skeleton` | 로딩 스켈레톤 |
| `separator` | 섹션 구분선 |

---

## 브라우저 지원

| 브라우저 | 지원 버전 |
|----------|-----------|
| iOS Safari | 16.4 이상 ✅ |
| Android Chrome | 111 이상 ✅ |
| Samsung Internet | 최신 ✅ |
| Chrome / Edge | 111 이상 ✅ |
| Firefox | 111 이상 ✅ |

---

## 배포

### Vercel (권장)

```bash
# Vercel CLI 사용 시
npx vercel

# 환경변수는 Vercel 대시보드에서 설정
# Project Settings → Environment Variables
```

> `Geolocation API`는 HTTPS에서만 동작합니다. Vercel 배포 시 자동으로 HTTPS가 적용됩니다.
