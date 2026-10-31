-- =========================================================
-- 공지사항 팝업 (계정 기준 읽음 처리)
-- Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 Run
-- =========================================================

CREATE TABLE IF NOT EXISTS public.notices (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL DEFAULT '',
  image_url   TEXT,
  link_url    TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notice_reads (
  notice_id   UUID        NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (notice_id, user_id)
);

ALTER TABLE public.notices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_reads ENABLE ROW LEVEL SECURITY;

-- notices: 로그인 회원 누구나 조회 / 운영진만 작성·수정·삭제
DROP POLICY IF EXISTS "notices_select_all"   ON public.notices;
DROP POLICY IF EXISTS "notices_write_admin"  ON public.notices;
CREATE POLICY "notices_select_all" ON public.notices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "notices_write_admin" ON public.notices
  FOR ALL TO authenticated
  USING      (public.get_my_role()::text IN ('OWNER','STAFF','ADMIN'))
  WITH CHECK (public.get_my_role()::text IN ('OWNER','STAFF','ADMIN'));

-- notice_reads: 본인 기록만 조회·추가 / 운영진은 전체 조회(읽은 인원 집계)
DROP POLICY IF EXISTS "notice_reads_select" ON public.notice_reads;
DROP POLICY IF EXISTS "notice_reads_insert" ON public.notice_reads;
CREATE POLICY "notice_reads_select" ON public.notice_reads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.get_my_role()::text IN ('OWNER','STAFF','ADMIN'));
CREATE POLICY "notice_reads_insert" ON public.notice_reads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
