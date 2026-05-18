# Product Requirements Document (PRD): 수원러닝크루 (SRC)

## 1. 프로젝트 개요 (Project Overview)
수원러닝크루(SRC) 멤버들의 러닝 기록 인증, 마라톤 PB 관리, 그리고 월간 생존(활동) 여부를 자동으로 계산하여 보여주는 모바일 최적화 웹 애플리케이션입니다.

## 2. 기술 스택 (Tech Stack)
*   **Framework**: Next.js (App Router 기반)
*   **Backend / DB / Auth**: Supabase (PostgreSQL) - Row Level Security(RLS)를 통한 권한 제어
*   **Styling & UI**: Tailwind CSS, shadcn/ui (모바일 반응형 최적화)
*   **Deployment**: Vercel

## 3. 인증 및 권한 시스템 (Authentication & Role System)
### 3.1 로그인 및 회원가입 (단일 인증)
*   이메일/비밀번호 등 타 가입 수단은 절대 사용하지 않습니다.
*   오직 Supabase Auth를 활용한 **'카카오톡 계정 연동 간편 로그인'** 단일 수단으로만 가입 및 로그인을 처리합니다.

### 3.2 권한 레벨 (Role)
*   **WAITING (대기)**: 최초 카카오 로그인(가입) 직후의 기본 상태. 어떠한 앱 기능도 사용 불가.
*   **REGULAR (정회원)**: 운영자 승인 완료 상태. 본인 기록 CRUD, 타인 기록 및 누적 거리 조회 가능. (단, 타인 연락처 등 민감 정보는 마스킹 처리 또는 노출 불가)
*   **PACER (페이서)**: 정회원 권한 + 회원 목록 조회 시 닉네임 옆에 페이서 전용 이모티콘(예: 🎈) 직관적 노출. (운영자가 임명)
*   **ADMIN (운영자)**: 시스템상 최소 1명 필수 유지. 가입 대기자(WAITING) 승인, 회원 강퇴/면제 처리, 모든 데이터(장소, 타인 기록 등) 수정 권한, 민감 정보 열람 권한.

## 4. 데이터베이스 및 데이터 관리 규칙 (Database & Data Management)
### 4.1 Soft Delete 정책 (중요)
*   **사용자**: 강퇴 또는 탈퇴 시 DB에서 완전히 삭제(Hard Delete)하지 않고 `is_active=false` 형태로 상태만 변경. 추후 카카오 계정으로 재가입하여 승인받을 경우, 기존 누적 거리 기록과 마라톤 PB가 그대로 복구되어야 함.
*   **장소**: 운영자가 장소를 삭제하더라도, 기존에 해당 장소로 등록된 인증 기록의 텍스트가 깨지거나 null이 되면 안 됨. (Soft Delete 처리하거나 인증 시점에 장소명 text를 기록 테이블에 스냅샷으로 별도 저장)

### 4.2 마라톤 PB 관리
*   **종목**: 10K, Half, Full (고정 카테고리)
*   **수정 권한**: 본인 및 ADMIN

## 5. 핵심 기능: 러닝 인증 시스템 (Core Feature: Running Authentication)
### 5.1 인증 폼 (Form) 입력 항목
*   **거리**: Number, 소수점 한 자리까지 (예: 5.0), **최소값 3.0 이상** Validation 필수
*   **장소**: Dropdown, ADMIN이 관리하는 목록에서 선택 필수
*   **날짜**: Date picker, 기본값: 오늘. (미래 날짜 선택 불가)
*   **인증 종류**: Enum (PERSONAL 개인런 / REGULAR 벙). 필수
*   **페이싱 유무**: Boolean (본인이 페이서 역할을 했는지 체크, 선택)

### 5.2 날짜 제한 (Date Restriction)
*   **REGULAR / PACER**: 오늘 기준 **최대 30일 전** 기록까지만 입력 가능.
*   **ADMIN**: 과거 날짜 제한 없이 **무기한 소급 입력** 가능.

### 5.3 기록 관리 권한
*   본인이 작성한 인증 기록은 본인이 직접 수정 및 삭제 가능.

## 6. 핵심 로직: 월간 생존(활동) 대시보드 (Core Logic: Monthly Survival)
### 6.1 대시보드 UI
*   접속 시 즉각적으로 이번 달 생존 달성 여부, 남은 필요 횟수, 현재 상태를 직관적으로 표시.

### 6.2 생존 조건 계산 알고리즘
(월 1일 00:00 기준 과거 데이터 리셋 및 뷰 갱신)
*   **[Rule 1] 1일 1회 카운트**: 하루에 2회 이상 인증 시 1회 인증한 것으로 병합하여 계산.
*   **[Rule 2] 벙(REGULAR) 우선순위**: 동일한 날에 PERSONAL과 REGULAR 인증이 모두 있다면, 해당 일자는 REGULAR 참여 1회로 계산.
*   **[Rule 3] 최종 생존 조건**:
    *   **조건 A**: 월 총 인증 일수 >= 2 **AND** 이 중 REGULAR(벙) 인증 일수 >= 1
    *   **조건 B**: (벙 참석 없이) 월 총 PERSONAL 인증 일수 >= 6
    *   *조건 A 또는 조건 B를 만족하면 이번 달 '생존' 처리.*

### 6.3 상태 면제 (Exemption) 처리
*   부상, 출장 등의 이유로 ADMIN이 회원의 상태를 '면제'로 변경할 수 있음.
*   면제 상태는 월이 넘어가도 자동으로 풀리지 않으며, ADMIN이 수동으로 '정상' 상태로 복구할 때까지 계속 유지됨.
*   면제자는 인증 의무에서 제외.

## 7. AI Vibe Coding Action Items
1.  **Auth 세팅**: 이메일/비밀번호 로그인을 철저히 배제하고, Supabase Auth를 이용한 오직 '카카오 소셜 로그인'만 허용하는 초기 세팅 진행.
2.  **DB 스키마**: Supabase RLS(Row Level Security) 규칙을 포함한 데이터베이스 스키마(SQL 또는 ORM) 작성.
3.  **프로젝트 구조**: Next.js App Router 기반의 폴더 구조 생성.
4.  **UI/UX**: shadcn/ui를 활용한 모바일 최적화 인증 폼 및 대시보드 UI 컴포넌트 개발.
5.  **비즈니스 로직**: 월별 생존 조건(Rule 1~3)을 계산하는 핵심 비즈니스 로직(Utility Function) 작성 및 엣지 케이스 테스트.
