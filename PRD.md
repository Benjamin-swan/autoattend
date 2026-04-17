# PRD: 온라인 출퇴근부 (AutoAttend)

## 1. 개요

직원이 웹에서 출근/퇴근 버튼을 클릭하면, 관리자 카카오톡으로 알림이 전송되고 Google Sheets에 자동 기록되는 출퇴근 관리 시스템.

---

## 2. 사용자

| 역할 | 설명 |
|------|------|
| 직원 (Employee) | 출근/퇴근 버튼 클릭 |
| 관리자 (Admin) | Google Sheets로 기록 확인 + 카카오톡 알림 수신 |

사용자 규모: 3명 (직원) + 1명 (관리자)

---

## 3. 핵심 기능

### 3.1 인증
- 아이디(이메일) + 비밀번호 로그인
- 회원가입 (자유 가입)
- 세션 유지 (JWT)
- **사용자 정보 저장**: Google Sheets `users` 시트에 저장

### 3.2 출퇴근 버튼
- 출근 버튼: 당일 출근 기록이 없을 때만 활성화
- 퇴근 버튼: 당일 출근 기록이 있고, 퇴근 기록이 없을 때만 활성화
- 클릭 시 현재 시각 기록 (KST)
- 중복 클릭 방지

### 3.3 카카오톡 알림 (나에게 보내기)
- 출근 시: `"[AutoAttend] 김철수님이 2026-04-17 09:02에 출근했습니다 ✅"`
- 퇴근 시: `"[AutoAttend] 김철수님이 2026-04-17 18:05에 퇴근했습니다 🏠"`
- 수신자: 관리자 카카오 계정 1개 (사전에 OAuth 토큰 등록)

### 3.4 Google Sheets 기록
- 출근/퇴근 시 자동으로 행 추가 또는 업데이트
- 관리자는 별도 로그인 없이 Google Sheets 직접 열어서 확인

---

## 4. 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Auth | NextAuth.js (Credentials Provider) |
| 데이터 저장 | Google Sheets API v4 |
| 카카오 API | Kakao REST API — 나에게 보내기 |
| 배포 | 로컬 실행 (`npm run dev`) |

> DB 없음 — Google Sheets가 DB 역할 대체

---

## 5. Google Sheets 구조

스프레드시트 1개, 시트 2개:

### 시트 1: `users`
| A: id | B: name | C: email | D: password_hash | E: role | F: created_at |
|-------|---------|----------|-----------------|---------|---------------|
| 1 | 김철수 | kim@example.com | $2b$... | employee | 2026-04-17 |

### 시트 2: `attendance`
| A: id | B: user_email | C: name | D: date | E: clock_in | F: clock_out | G: work_hours |
|-------|--------------|---------|---------|-------------|--------------|---------------|
| 1 | kim@example.com | 김철수 | 2026-04-17 | 09:02 | 18:05 | 8h 3m |

---

## 6. 카카오 API 설정

1. [카카오 디벨로퍼스](https://developers.kakao.com) 앱 생성
2. 플랫폼 → Web 등록 (도메인: `http://localhost:3000`)
3. 관리자가 카카오 로그인 → `talk_message` 스코프 동의
4. Access Token / Refresh Token을 `.env.local`에 저장
5. 서버에서 `POST https://kapi.kakao.com/v2/api/talk/memo/default/send` 호출

---

## 7. Google Sheets API 설정

1. Google Cloud Console → 프로젝트 생성
2. Google Sheets API 활성화
3. 서비스 계정 생성 → JSON 키 다운로드
4. 스프레드시트에 서비스 계정 이메일 편집자 권한 공유
5. `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_SHEET_ID` → `.env.local`에 저장

---

## 8. 환경변수 (`.env.local`)

```
NEXTAUTH_SECRET=랜덤문자열
NEXTAUTH_URL=http://localhost:3000

# Google Sheets
GOOGLE_SHEET_ID=스프레드시트ID
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# 카카오
KAKAO_ACCESS_TOKEN=관리자_액세스_토큰
KAKAO_REFRESH_TOKEN=관리자_리프레시_토큰
KAKAO_REST_API_KEY=앱_REST_API_키
```

---

## 9. 페이지 구성

| 경로 | 설명 |
|------|------|
| `/login` | 로그인 |
| `/signup` | 회원가입 |
| `/` | 출퇴근 버튼 메인 (로그인 필요) |

> 관리자 대시보드 불필요 — Google Sheets 직접 확인

---

## 10. 사용자 플로우

```
[직원]
로그인 → 메인 페이지
→ 출근 버튼 클릭 → Sheets에 행 추가 + 카카오 알림 → 출근 버튼 비활성화
→ 퇴근 버튼 클릭 → Sheets 해당 행 업데이트 + 카카오 알림 → 완료

[관리자]
카카오톡 알림 수신 → Google Sheets 열어서 기록 확인
```

---

## 11. 구현 순서 (30분 목표)

1. **[3분]** Next.js 프로젝트 생성 + 패키지 설치
2. **[5분]** Google Cloud 서비스 계정 + Sheets 셋업
3. **[5분]** NextAuth.js 로그인 / 회원가입 (Sheets users 시트 연동)
4. **[8분]** 출퇴근 버튼 메인 페이지 + Sheets attendance 연동
5. **[5분]** 카카오 API 연동
6. **[4분]** UI 다듬기 + 테스트

---

## 12. 제외 범위 (v1)

- 관리자 웹 대시보드 (Sheets로 대체)
- 지각/조기퇴근 판정 로직
- 월간 리포트 / 엑셀 다운로드
- 모바일 앱
- 배포 (로컬 실행만)
