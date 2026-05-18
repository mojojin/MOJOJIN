-- =============================================================================
-- 수원러닝크루 (SRC) - Supabase Database Schema
-- =============================================================================
-- 실행 순서: Supabase Dashboard > SQL Editor 에 전체 복사 후 실행
-- =============================================================================


-- =============================================================================
-- SECTION 1: ENUM TYPES
-- =============================================================================

-- 회원 권한 레벨
CREATE TYPE user_role AS ENUM ('WAITING', 'REGULAR', 'PACER', 'ADMIN');

-- 러닝 인증 종류
CREATE TYPE run_type AS ENUM ('PERSONAL', 'REGULAR');

-- 마라톤 종목
CREATE TYPE marathon_category AS ENUM ('TEN_K', 'HALF', 'FULL');


-- =============================================================================
-- SECTION 2: TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2-1. profiles (회원 프로필)
-- auth.users와 1:1 연결, Soft Delete 지원
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_id      TEXT        UNIQUE NOT NULL,           -- 카카오 고유 ID (재가입 복구 핵심 키)
  nickname      TEXT        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'WAITING',
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,      -- Soft Delete: false = 강퇴/탈퇴
  is_exempted   BOOLEAN     NOT NULL DEFAULT FALSE,     -- 면제 상태 (ADMIN 수동 관리)
  phone         TEXT,                                   -- 연락처 (ADMIN만 열람 가능)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS '회원 프로필 테이블. is_active=false 로 Soft Delete 처리.';
COMMENT ON COLUMN public.profiles.kakao_id IS '카카오 provider의 sub 값. 재가입 시 기존 데이터 복구에 사용.';
COMMENT ON COLUMN public.profiles.is_exempted IS 'ADMIN이 수동 지정. 월 초가 되어도 자동 해제되지 않음.';


-- -----------------------------------------------------------------------------
-- 2-2. locations (장소)
-- Soft Delete 지원, 삭제 시 인증 기록의 장소명은 스냅샷으로 보존됨
-- -----------------------------------------------------------------------------
CREATE TABLE public.locations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,        -- Soft Delete
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.locations IS '장소 목록. is_active=false 로 Soft Delete 처리. 기존 인증 기록 보호.';


-- -----------------------------------------------------------------------------
-- 2-3. running_records (러닝 인증 기록)
-- location_name_snapshot: 장소 Soft Delete 시에도 기록명 보존
-- -----------------------------------------------------------------------------
CREATE TABLE public.running_records (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  run_date                DATE          NOT NULL,
  distance_km             NUMERIC(5,1)  NOT NULL CHECK (distance_km >= 3.0),  -- 최소 3.0km
  location_id             UUID          REFERENCES public.locations(id) ON DELETE SET NULL,
  location_name_snapshot  TEXT          NOT NULL,       -- 인증 시점 장소명 스냅샷 (필수)
  run_type                run_type      NOT NULL,        -- PERSONAL | REGULAR(벙)
  is_pacing               BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.running_records IS '러닝 인증 기록 테이블.';
COMMENT ON COLUMN public.running_records.location_name_snapshot IS '장소가 Soft Delete 되어도 기록명이 유지되도록 인증 시점의 장소명을 스냅샷으로 저장.';
COMMENT ON COLUMN public.running_records.distance_km IS '소수점 1자리, 최소 3.0km 이상.';


-- -----------------------------------------------------------------------------
-- 2-4. marathon_pbs (마라톤 개인 최고 기록)
-- 사용자당 종목별 1개 기록 (UPSERT로 관리)
-- -----------------------------------------------------------------------------
CREATE TABLE public.marathon_pbs (
  id            UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category      marathon_category NOT NULL,             -- TEN_K | HALF | FULL
  record_time   INTERVAL          NOT NULL,             -- 예: '00:45:00'
  achieved_at   DATE,
  updated_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category)                            -- 사용자당 종목별 1개
);

COMMENT ON TABLE public.marathon_pbs IS '마라톤 PB 테이블. (user_id, category) 조합은 유일.';


-- =============================================================================
-- SECTION 3: INDEXES
-- =============================================================================

-- 월간 생존 계산 쿼리 최적화 (user_id + run_date 범위 검색)
CREATE INDEX idx_running_records_user_date ON public.running_records (user_id, run_date);

-- 장소 활성 목록 조회 최적화
CREATE INDEX idx_locations_active ON public.locations (is_active) WHERE is_active = TRUE;

-- 회원 활성 목록 조회 최적화
CREATE INDEX idx_profiles_active_role ON public.profiles (is_active, role) WHERE is_active = TRUE;


-- =============================================================================
-- SECTION 4: TRIGGERS (자동화)
-- =============================================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles updated_at 트리거
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- running_records updated_at 트리거
CREATE TRIGGER trg_running_records_updated_at
  BEFORE UPDATE ON public.running_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- marathon_pbs updated_at 트리거
CREATE TRIGGER trg_marathon_pbs_updated_at
  BEFORE UPDATE ON public.marathon_pbs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 카카오 로그인 시 profiles 자동 생성 트리거
-- auth.users 에 새 row 삽입 시 → profiles에 WAITING role로 자동 생성
-- 단, 기존 kakao_id가 있으면(재가입 시) is_active만 true로 복구
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_kakao_id TEXT;
  v_nickname TEXT;
  v_existing_profile_id UUID;
BEGIN
  -- 카카오 provider에서 sub(kakao user id)와 nickname 추출
  v_kakao_id := NEW.raw_app_meta_data->>'provider_id';
  v_nickname  := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    '러너'
  );

  -- 동일 kakao_id로 기존 비활성 프로필 존재 여부 확인 (재가입 시나리오)
  SELECT id INTO v_existing_profile_id
  FROM public.profiles
  WHERE kakao_id = v_kakao_id AND is_active = FALSE
  LIMIT 1;

  IF v_existing_profile_id IS NOT NULL THEN
    -- 재가입: 기존 프로필 id를 새 auth.users id로 업데이트 + 활성화 (기존 기록 복구)
    UPDATE public.profiles
    SET
      id        = NEW.id,
      is_active = TRUE,
      updated_at = NOW()
    WHERE id = v_existing_profile_id;
  ELSE
    -- 신규 가입: WAITING role로 프로필 생성
    INSERT INTO public.profiles (id, kakao_id, nickname, role, is_active)
    VALUES (NEW.id, v_kakao_id, v_nickname, 'WAITING', TRUE);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users INSERT 시 트리거 연결
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- RLS 활성화
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.running_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marathon_pbs   ENABLE ROW LEVEL SECURITY;

-- 현재 로그인 유저의 role을 반환하는 헬퍼 함수 (RLS 정책에서 재사용)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid() AND is_active = TRUE
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- -----------------------------------------------------------------------------
-- RLS: profiles 테이블
-- -----------------------------------------------------------------------------

-- [SELECT] 본인: 전체 열람 / 타인: phone 제외 열람 / ADMIN: 모든 컬럼 열람
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());   -- 본인 전체 열람

CREATE POLICY "profiles_select_others"
  ON public.profiles FOR SELECT
  USING (
    is_active = TRUE
    AND id != auth.uid()
    AND public.get_my_role() IN ('REGULAR', 'PACER', 'ADMIN')
  );
-- ※ phone 컬럼 마스킹은 View 또는 앱 레이어에서 처리 (RLS는 row 단위)

-- [INSERT] 트리거로만 생성, 직접 INSERT 불가
-- (트리거 함수가 SECURITY DEFINER라 RLS 우회하여 동작)

-- [UPDATE] 본인은 닉네임/phone만 수정 가능 / ADMIN은 모든 컬럼 수정
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'ADMIN')
  WITH CHECK (public.get_my_role() = 'ADMIN');


-- -----------------------------------------------------------------------------
-- RLS: locations 테이블
-- -----------------------------------------------------------------------------

-- [SELECT] REGULAR 이상: 활성 장소만 조회
CREATE POLICY "locations_select_active_members"
  ON public.locations FOR SELECT
  USING (
    is_active = TRUE
    AND public.get_my_role() IN ('REGULAR', 'PACER', 'ADMIN')
  );

-- [SELECT] ADMIN: 비활성 장소 포함 전체 조회
CREATE POLICY "locations_select_admin_all"
  ON public.locations FOR SELECT
  USING (public.get_my_role() = 'ADMIN');

-- [INSERT / UPDATE / DELETE] ADMIN 전용
CREATE POLICY "locations_insert_admin"
  ON public.locations FOR INSERT
  WITH CHECK (public.get_my_role() = 'ADMIN');

CREATE POLICY "locations_update_admin"
  ON public.locations FOR UPDATE
  USING (public.get_my_role() = 'ADMIN')
  WITH CHECK (public.get_my_role() = 'ADMIN');

CREATE POLICY "locations_delete_admin"
  ON public.locations FOR DELETE
  USING (public.get_my_role() = 'ADMIN');


-- -----------------------------------------------------------------------------
-- RLS: running_records 테이블
-- -----------------------------------------------------------------------------

-- [SELECT] REGULAR 이상: 전체 조회 가능
CREATE POLICY "running_records_select_members"
  ON public.running_records FOR SELECT
  USING (public.get_my_role() IN ('REGULAR', 'PACER', 'ADMIN'));

-- [INSERT] REGULAR 이상: 본인 기록만 삽입
CREATE POLICY "running_records_insert_own"
  ON public.running_records FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.get_my_role() IN ('REGULAR', 'PACER', 'ADMIN')
  );

-- [UPDATE] 본인 기록 수정 + ADMIN은 모든 기록 수정
CREATE POLICY "running_records_update_own"
  ON public.running_records FOR UPDATE
  USING (user_id = auth.uid() AND public.get_my_role() IN ('REGULAR', 'PACER'))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "running_records_update_admin"
  ON public.running_records FOR UPDATE
  USING (public.get_my_role() = 'ADMIN')
  WITH CHECK (public.get_my_role() = 'ADMIN');

-- [DELETE] 본인 기록 삭제 + ADMIN은 모든 기록 삭제
CREATE POLICY "running_records_delete_own"
  ON public.running_records FOR DELETE
  USING (user_id = auth.uid() AND public.get_my_role() IN ('REGULAR', 'PACER'));

CREATE POLICY "running_records_delete_admin"
  ON public.running_records FOR DELETE
  USING (public.get_my_role() = 'ADMIN');


-- -----------------------------------------------------------------------------
-- RLS: marathon_pbs 테이블
-- -----------------------------------------------------------------------------

-- [SELECT] REGULAR 이상: 전체 조회
CREATE POLICY "marathon_pbs_select_members"
  ON public.marathon_pbs FOR SELECT
  USING (public.get_my_role() IN ('REGULAR', 'PACER', 'ADMIN'));

-- [INSERT] 본인 기록만 + ADMIN
CREATE POLICY "marathon_pbs_insert_own"
  ON public.marathon_pbs FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.get_my_role() IN ('REGULAR', 'PACER', 'ADMIN')
  );

-- [UPDATE] 본인 + ADMIN
CREATE POLICY "marathon_pbs_update_own"
  ON public.marathon_pbs FOR UPDATE
  USING (user_id = auth.uid() AND public.get_my_role() IN ('REGULAR', 'PACER'))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "marathon_pbs_update_admin"
  ON public.marathon_pbs FOR UPDATE
  USING (public.get_my_role() = 'ADMIN')
  WITH CHECK (public.get_my_role() = 'ADMIN');

-- [DELETE] 본인 + ADMIN
CREATE POLICY "marathon_pbs_delete_own"
  ON public.marathon_pbs FOR DELETE
  USING (user_id = auth.uid() AND public.get_my_role() IN ('REGULAR', 'PACER'));

CREATE POLICY "marathon_pbs_delete_admin"
  ON public.marathon_pbs FOR DELETE
  USING (public.get_my_role() = 'ADMIN');


-- =============================================================================
-- SECTION 6: SEED DATA (초기 데이터)
-- =============================================================================

-- 기본 장소 목록 (필요에 따라 수정)
INSERT INTO public.locations (name) VALUES
  ('광교호수공원'),
  ('수원월드컵경기장'),
  ('효원공원'),
  ('일월공원'),
  ('서호공원');


-- =============================================================================
-- 완료!
-- 다음 단계:
--   1. Supabase Dashboard > Authentication > Providers > Kakao 활성화
--   2. 카카오 디벨로퍼스 Redirect URI에 Supabase 콜백 URL 등록
--   3. 최초 ADMIN 계정: 로그인 후 아래 쿼리로 수동 지정
--      UPDATE public.profiles SET role = 'ADMIN' WHERE kakao_id = '여기에_카카오_ID';
-- =============================================================================
