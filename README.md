# AutoAttend — 온라인 출퇴근 관리 시스템

직원이 웹에서 출근/퇴근 버튼을 클릭하면, 관리자 카카오톡으로 알림이 전송되고 Google Sheets에 자동으로 기록되는 출퇴근 관리 웹앱입니다.

---

## 주요 기능

- **출근 / 퇴근 버튼**: 당일 중복 클릭 방지, KST 기준 시각 자동 기록
- **카카오톡 알림**: 출퇴근 시 관리자 카카오 계정으로 즉시 알림 전송
- **Google Sheets 자동 기록**: 별도 DB 없이 Sheets가 데이터 저장소 역할
- **로그인 / 회원가입**: 이메일 + 비밀번호 인증 (JWT 세션)
- **회원탈퇴**: 계정 및 사용자 데이터 삭제

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 스타일 | Tailwind CSS v4 |
| 인증 | NextAuth.js (Credentials Provider, JWT) |
| 데이터 저장 | Google Sheets API v4 |
| 알림 | Kakao REST API (나에게 보내기) |
| 언어 | TypeScript |

---

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 항목을 채웁니다.

```env
NEXTAUTH_SECRET=랜덤_문자열
NEXTAUTH_URL=http://localhost:3000

# Google Sheets
GOOGLE_SHEET_ID=스프레드시트_ID
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# 카카오
KAKAO_ACCESS_TOKEN=관리자_액세스_토큰
KAKAO_REFRESH_TOKEN=관리자_리프레시_토큰
KAKAO_REST_API_KEY=앱_REST_API_키
```

> `.env.local`은 `.gitignore`에 포함되어 있으므로 절대 커밋하지 마세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 외부 서비스 설정

### Google Sheets

1. Google Cloud Console에서 프로젝트 생성
2. Google Sheets API 활성화
3. 서비스 계정 생성 → JSON 키 다운로드
4. 스프레드시트에 서비스 계정 이메일을 **편집자**로 공유
5. 스프레드시트에 시트 2개 생성:
   - `users` 시트: `id / name / email / password_hash / role / created_at`
   - `attendance` 시트: `id / user_email / name / date / clock_in / clock_out / work_hours`

### 카카오

1. [카카오 디벨로퍼스](https://developers.kakao.com)에서 앱 생성
2. 플랫폼 → Web 등록 (`http://localhost:3000`)
3. 관리자 계정으로 카카오 로그인 → `talk_message` 스코프 동의
4. 발급된 액세스 토큰 / 리프레시 토큰을 `.env.local`에 저장

---

## 페이지 구성

| 경로 | 설명 |
|------|------|
| `/` | 출퇴근 버튼 메인 (로그인 필요) |
| `/login` | 로그인 |
| `/signup` | 회원가입 |

---

## v1 제외 범위

- 관리자 웹 대시보드 (Google Sheets로 대체)
- 지각 / 조기퇴근 판정
- 월간 리포트 / 엑셀 다운로드
- 모바일 앱
- 프로덕션 배포
