-- 마라톤 데이터 업데이트 (기존 레코드 보완)
-- Supabase SQL Editor에서 실행해주세요.


-- 성태현 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '성태현/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 15),
        event_name = COALESCE(event_name, '2025 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:03:03', 15, '2025 동아마라톤');
    END IF;
  END IF;
END $$;

-- 박병진 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '박병진/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 6),
        event_name = COALESCE(event_name, '2025 LISBON MARATHON')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '02:59:48', 6, '2025 LISBON MARATHON');
    END IF;
  END IF;
END $$;

-- 김송일 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김송일/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, 'JTBC 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:35:28', 3, 'JTBC 서울마라톤');
    END IF;
  END IF;
END $$;

-- 신철우 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '신철우/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2025 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:36:28', 5, '2025 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 강수형 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '강수형/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 7),
        event_name = COALESCE(event_name, '2024 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:47:18', 7, '2024 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 김진 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김진/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2024 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:10:45', 1, '2024 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 최선규 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '최선규/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2024 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:37:14', 1, '2024 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 박재명 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '박재명/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2023 JTBC 서울 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:47:13', 3, '2023 JTBC 서울 마라톤');
    END IF;
  END IF;
END $$;

-- 한승혜 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '한승혜/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2025 서울레이스')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:45:20', 2, '2025 서울레이스');
    END IF;
  END IF;
END $$;

-- 신혜진 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '신혜진/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 7),
        event_name = COALESCE(event_name, '2025 대구국제마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:52:04', 7, '2025 대구국제마라톤');
    END IF;
  END IF;
END $$;

-- 윤정훈 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '윤정훈/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2025 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:28:09', 5, '2025 동아마라톤');
    END IF;
  END IF;
END $$;

-- 조동호 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '조동호/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2025 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:24:33', 3, '2025 동아마라톤');
    END IF;
  END IF;
END $$;

-- 김기섭 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김기섭/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2024 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:38:01', 2, '2024 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 이용훈 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이용훈/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 7),
        event_name = COALESCE(event_name, '2024 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:20:12', 7, '2024 동아마라톤');
    END IF;
  END IF;
END $$;

-- 손민아 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '손민아/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2024 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:33:09', 2, '2024 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 김민주 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김민주/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2024 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:12:40', 1, '2024 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 이광희 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이광희/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2024 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:21:53', 2, '2024 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 정승현 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '정승현/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2025 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:24:51', 5, '2025 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 조주환 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '조주환/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2024 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:17:49', 2, '2024 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 김현경 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김현경/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2024 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:55:00', 3, '2024 서울마라톤');
    END IF;
  END IF;
END $$;

-- 신동인 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '신동인/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2024 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:35:48', 3, '2024 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 이지수 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이지수/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2026 대구마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:51:46', 2, '2026 대구마라톤');
    END IF;
  END IF;
END $$;

-- 박성만 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '박성만/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2024 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:52:31', 3, '2024 서울마라톤');
    END IF;
  END IF;
END $$;

-- 김은혜 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김은혜/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2026 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:55:31', 5, '2026 동아마라톤');
    END IF;
  END IF;
END $$;

-- 정원석 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '정원석/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2024 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:06:06', 3, '2024 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 박진하 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '박진하/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 4),
        event_name = COALESCE(event_name, '2024 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:25:39', 4, '2024 서울마라톤');
    END IF;
  END IF;
END $$;

-- 김가을 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김가을/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 8),
        event_name = COALESCE(event_name, '2023 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:59:50', 8, '2023 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 이희진 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이희진/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2023 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:05:16', 1, '2023 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 지해웅 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '지해웅/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2026 서울동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:28:46', 5, '2026 서울동아마라톤');
    END IF;
  END IF;
END $$;

-- 김해인 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김해인/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 6),
        event_name = COALESCE(event_name, '2023 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:56:30', 6, '2023 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 오인석 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '오인석/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2024 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '02:59:43', 3, '2024 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 임병진 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '임병진/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2025 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:22:08', 5, '2025 동아마라톤');
    END IF;
  END IF;
END $$;

-- 허상범 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '허상범/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 9),
        event_name = COALESCE(event_name, '2025서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:58:26', 9, '2025서울마라톤');
    END IF;
  END IF;
END $$;

-- 이호길 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이호길/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2024 서울국제마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '02:59:25', 3, '2024 서울국제마라톤');
    END IF;
  END IF;
END $$;

-- 이한규 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이한규/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 10),
        event_name = COALESCE(event_name, '2024 경기마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:38:28', 10, '2024 경기마라톤');
    END IF;
  END IF;
END $$;

-- 이성식 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이성식/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2025 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '02:57:25', 5, '2025 동아마라톤');
    END IF;
  END IF;
END $$;

-- 박주하 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '박주하/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2024 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:38:13', 2, '2024 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 유승관 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '유승관/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2026 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:25:58', 3, '2026 서울마라톤');
    END IF;
  END IF;
END $$;

-- 나정수 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '나정수/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2023 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:50:07', 1, '2023 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 김태훈 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김태훈/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2024 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:45:01', 3, '2024 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 신다은 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '신다은/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2024 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:20:15', 2, '2024 서울마라톤');
    END IF;
  END IF;
END $$;

-- 문지성 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '문지성/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2025 JTBC')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:08:48', 2, '2025 JTBC');
    END IF;
  END IF;
END $$;

-- 전재한 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '전재한/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2025 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:38:46', 3, '2025 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 김상일 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김상일/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2023춘첨마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:13:19', 3, '2023춘첨마라톤');
    END IF;
  END IF;
END $$;

-- 이민진 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이민진/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 4),
        event_name = COALESCE(event_name, '2022 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:24:57', 4, '2022 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 최우현 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '최우현/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2025 jtbc 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:45:55', 5, '2025 jtbc 마라톤');
    END IF;
  END IF;
END $$;

-- 김명록 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김명록/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2026 서울동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '02:58:56', 5, '2026 서울동아마라톤');
    END IF;
  END IF;
END $$;

-- 김윤섭 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김윤섭/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2026 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '02:58:38', 5, '2026 동아마라톤');
    END IF;
  END IF;
END $$;

-- 변지훈 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '변지훈/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2024 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:50:48', 3, '2024 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 주민선 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '주민선/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2025 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:49:55', 2, '2025 서울마라톤');
    END IF;
  END IF;
END $$;

-- 최광욱 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '최광욱/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2026 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '02:52:19', 5, '2026 서울마라톤');
    END IF;
  END IF;
END $$;

-- 김성룡 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김성룡/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2026 서울동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '02:47:14', 5, '2026 서울동아마라톤');
    END IF;
  END IF;
END $$;

-- 장가희 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '장가희/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2024 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:50:46', 2, '2024 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 박준재 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '박준재/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2024 JTBC 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:49:19', 1, '2024 JTBC 서울마라톤');
    END IF;
  END IF;
END $$;

-- 이아인 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이아인/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2024 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '05:35:53', 1, '2024 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 조창균 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '조창균/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2025 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:02:09', 2, '2025 서울마라톤');
    END IF;
  END IF;
END $$;

-- 고병관 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '고병관/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2025 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:09:04', 2, '2025 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 하수연 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '하수연/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2024 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '05:03:50', 1, '2024 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- Mallesh 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE 'Mallesh/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2024 JTBC Seoul Marathon')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:20:27', 1, '2024 JTBC Seoul Marathon');
    END IF;
  END IF;
END $$;

-- 이창 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이창/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2024년 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:51:46', 2, '2024년 동아마라톤');
    END IF;
  END IF;
END $$;

-- 이동규 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이동규/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2024 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:12:03', 1, '2024 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 김지원 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김지원/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2024 제마')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:58:12', 1, '2024 제마');
    END IF;
  END IF;
END $$;

-- 홍의상 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '홍의상/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2025동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:13:33', 3, '2025동아마라톤');
    END IF;
  END IF;
END $$;

-- 김건호 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김건호/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '오사카마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:23:57', 1, '오사카마라톤');
    END IF;
  END IF;
END $$;

-- 신홍민 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '신홍민/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2024 제18회 충북 음성 반기문 마라톤대회')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '05:20:39', 1, '2024 제18회 충북 음성 반기문 마라톤대회');
    END IF;
  END IF;
END $$;

-- 김혜란 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김혜란/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2026동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:54:36', 2, '2026동아마라톤');
    END IF;
  END IF;
END $$;

-- 김동휘 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김동휘/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2025 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:46:51', 3, '2025 서울마라톤');
    END IF;
  END IF;
END $$;

-- 이철우 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이철우/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 서울동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:39:31', 1, '2025 서울동아마라톤');
    END IF;
  END IF;
END $$;

-- 김유환 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김유환/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2025 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:28:45', 2, '2025 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 장현우 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '장현우/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2025 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:34:22', 3, '2025 서울마라톤');
    END IF;
  END IF;
END $$;

-- 이은지 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이은지/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:50:09', 1, '2025 동아마라톤');
    END IF;
  END IF;
END $$;

-- 우선화 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '우선화/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:50:42', 1, '2025 서울마라톤');
    END IF;
  END IF;
END $$;

-- 박주영 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '박주영/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2026 서울동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:29:56', 3, '2026 서울동아마라톤');
    END IF;
  END IF;
END $$;

-- 이유나 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이유나/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 4),
        event_name = COALESCE(event_name, '2025 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:45:50', 4, '2025 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 최설화 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '최설화/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025경주국제마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:14:38', 1, '2025경주국제마라톤');
    END IF;
  END IF;
END $$;

-- 이승화 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이승화/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:22:35', 1, '2025 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 김시온 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김시온/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:56:01', 1, '2025 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 김준영 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김준영/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 춘천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:23:55', 1, '2025 춘천마라톤');
    END IF;
  END IF;
END $$;

-- 박정민 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '박정민/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 JTBC 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:27:17', 1, '2025 JTBC 서울마라톤');
    END IF;
  END IF;
END $$;

-- 김지혜 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김지혜/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2026 서울동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:32:45', 2, '2026 서울동아마라톤');
    END IF;
  END IF;
END $$;

-- 김지은 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김지은/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:36:58', 1, '2025 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 정혜유 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '정혜유/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2025 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:42:06', 3, '2025 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 조하윤 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '조하윤/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:01:14', 1, '2025 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 김홍진 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김홍진/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:51:03', 1, '2025 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 조윤상 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '조윤상/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 2),
        event_name = COALESCE(event_name, '2025 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:37:15', 2, '2025 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 이엘리 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이엘리/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:51:12', 1, '2025 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 김경철 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김경철/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:15:08', 1, '2025 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 이동복 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이동복/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 JTBC 서울 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:26:53', 1, '2025 JTBC 서울 마라톤');
    END IF;
  END IF;
END $$;

-- 허은자 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '허은자/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 JTBC')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:15:07', 1, '2025 JTBC');
    END IF;
  END IF;
END $$;

-- 한현려 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '한현려/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:56:23', 1, '2025 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 이지훈 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이지훈/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 42),
        event_name = COALESCE(event_name, '2025 JTBC마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '02:57:28', 42, '2025 JTBC마라톤');
    END IF;
  END IF;
END $$;

-- 전인규 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '전인규/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2026 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:16:58', 3, '2026 서울마라톤');
    END IF;
  END IF;
END $$;

-- 오은지 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '오은지/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:56:42', 1, '2025 JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 김성제 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김성제/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, 'JTBC 마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:40:01', 1, 'JTBC 마라톤');
    END IF;
  END IF;
END $$;

-- 최의룡 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '최의룡/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2025손기전평화마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:44:49', 3, '2025손기전평화마라톤');
    END IF;
  END IF;
END $$;

-- 황예은 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '황예은/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2026 동아마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:56:07', 3, '2026 동아마라톤');
    END IF;
  END IF;
END $$;

-- 박인동 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '박인동/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 인천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:52:34', 1, '2025 인천마라톤');
    END IF;
  END IF;
END $$;

-- 이현우 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이현우/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025인천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:35:32', 1, '2025인천마라톤');
    END IF;
  END IF;
END $$;

-- 윤태웅 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '윤태웅/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025 인천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:53:54', 1, '2025 인천마라톤');
    END IF;
  END IF;
END $$;

-- 구자윤 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '구자윤/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 3),
        event_name = COALESCE(event_name, '2026 대구마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:19:32', 3, '2026 대구마라톤');
    END IF;
  END IF;
END $$;

-- 이주호 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이주호/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025인천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:40:49', 1, '2025인천마라톤');
    END IF;
  END IF;
END $$;

-- 송태경 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '송태경/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2025인천마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:53:54', 1, '2025인천마라톤');
    END IF;
  END IF;
END $$;

-- 김승종 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '김승종/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 5),
        event_name = COALESCE(event_name, '2025김포한강마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:12:44', 5, '2025김포한강마라톤');
    END IF;
  END IF;
END $$;

-- 허진 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '허진/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2026 챌린지레이스')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:32:36', 1, '2026 챌린지레이스');
    END IF;
  END IF;
END $$;

-- 정광모 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '정광모/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2026 서울마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:29:23', 1, '2026 서울마라톤');
    END IF;
  END IF;
END $$;

-- 안종암 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '안종암/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '26 경기마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:31:21', 1, '26 경기마라톤');
    END IF;
  END IF;
END $$;

-- 손석호 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '손석호/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2026 경기마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:57:10', 1, '2026 경기마라톤');
    END IF;
  END IF;
END $$;

-- 성시현 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '성시현/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2026 경기마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:58:14', 1, '2026 경기마라톤');
    END IF;
  END IF;
END $$;

-- 이충호 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '이충호/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '경기마')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:47:42', 1, '경기마');
    END IF;
  END IF;
END $$;

-- 복동현 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '복동현/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2026 경기마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '04:41:12', 1, '2026 경기마라톤');
    END IF;
  END IF;
END $$;

-- 문민휘 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '문민휘/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2026 경기마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '03:53:56', 1, '2026 경기마라톤');
    END IF;
  END IF;
END $$;

-- 조도현 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '조도현/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), 1),
        event_name = COALESCE(event_name, '2026경기마라톤')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '05:34:31', 1, '2026경기마라톤');
    END IF;
  END IF;
END $$;
