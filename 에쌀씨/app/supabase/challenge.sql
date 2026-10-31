-- =========================================================
-- 12월 원팀 챌린지 (One-Team Challenge) 데이터베이스 스키마
-- Supabase SQL Editor 에 붙여넣고 Run 해주세요.
-- =========================================================

-- 1. 팀 정보 테이블
CREATE TABLE IF NOT EXISTS public.challenge_teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                            -- 팀명 (예: 광교 불꽃러너)
  intro           TEXT,                                     -- 팀 구호 및 한줄 소개
  insta_url       TEXT,                                     -- 인스타그램 소개 피드 링크
  insta_verified  BOOLEAN NOT NULL DEFAULT FALSE,           -- 인스타 미션(+10점) 관리자 승인 여부
  color           TEXT DEFAULT '#CCFF00',                   -- 팀 대표 색상 (HEX)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 팀원 매핑 테이블
CREATE TABLE IF NOT EXISTS public.challenge_team_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  port_group      INT NOT NULL DEFAULT 3,                   -- 포트 (1: 에이스, 2: 꾸준, 3: 일반, 4: 신규/비활성)
  is_captain      BOOLEAN NOT NULL DEFAULT FALSE,           -- 팀장 여부
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)                                           -- 한 회원은 한 팀에만 소속
);

-- 3. 팀별 누적/보너스 점수 기록 로그 테이블
CREATE TABLE IF NOT EXISTS public.challenge_score_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- 기여한 회원 (개인 런 등)
  record_id       UUID REFERENCES public.running_records(id) ON DELETE CASCADE,
  rule_type       TEXT NOT NULL,                            -- BASE_RUN(기본), DISTANCE_CAP(5km상한), GATHERING(3인벙), HOST(벙주), MORNING(새벽런), CROSS_RUN(타팀동반), STAMP(장소탐방), WEEKLY_ALL(전원출석), PERFECT_RUN(완전체), INSTA_MISSION(소개미션)
  points          INT NOT NULL,                             -- 획득 점수
  description     TEXT,                                     -- 설명 (예: "만석공원 3인 벙 +2점")
  earned_date     DATE NOT NULL DEFAULT CURRENT_DATE,       -- 점수 획득 일자
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RLS 보안 설정
ALTER TABLE public.challenge_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_score_logs ENABLE ROW LEVEL SECURITY;

-- 조회: 로그인한 회원은 누구나 조회 가능
DROP POLICY IF EXISTS "challenge_teams_select" ON public.challenge_teams;
CREATE POLICY "challenge_teams_select" ON public.challenge_teams FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "challenge_team_members_select" ON public.challenge_team_members;
CREATE POLICY "challenge_team_members_select" ON public.challenge_team_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "challenge_score_logs_select" ON public.challenge_score_logs;
CREATE POLICY "challenge_score_logs_select" ON public.challenge_score_logs FOR SELECT TO authenticated USING (true);

-- 관리자 수정/등록 권한 (ADMIN, OWNER, STAFF)
DROP POLICY IF EXISTS "challenge_admin_manage_teams" ON public.challenge_teams;
CREATE POLICY "challenge_admin_manage_teams" ON public.challenge_teams FOR ALL TO authenticated
  USING (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'))
  WITH CHECK (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'));

DROP POLICY IF EXISTS "challenge_admin_manage_members" ON public.challenge_team_members;
CREATE POLICY "challenge_admin_manage_members" ON public.challenge_team_members FOR ALL TO authenticated
  USING (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'))
  WITH CHECK (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'));

DROP POLICY IF EXISTS "challenge_admin_manage_scores" ON public.challenge_score_logs;
CREATE POLICY "challenge_admin_manage_scores" ON public.challenge_score_logs FOR ALL TO authenticated
  USING (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'))
  WITH CHECK (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'));

-- 팀장 본인 팀 소개 링크 업데이트 허용
DROP POLICY IF EXISTS "challenge_captain_update_team" ON public.challenge_teams;
CREATE POLICY "challenge_captain_update_team" ON public.challenge_teams FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_team_members
      WHERE team_id = public.challenge_teams.id
        AND user_id = auth.uid()
        AND is_captain = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenge_team_members
      WHERE team_id = public.challenge_teams.id
        AND user_id = auth.uid()
        AND is_captain = true
    )
  );
