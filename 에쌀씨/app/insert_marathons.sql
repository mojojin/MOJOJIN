-- 마라톤 데이터 일괄 마이그레이션 스크립트
-- Supabase SQL Editor에서 실행해주세요.


INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:03:03', 15, '2025 동아마라톤'
FROM profiles 
WHERE nickname LIKE '성태현/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '02:59:48', 6, '2025 LISBON MARATHON'
FROM profiles 
WHERE nickname LIKE '박병진/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:35:28', 3, 'JTBC 서울마라톤'
FROM profiles 
WHERE nickname LIKE '김송일/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:36:28', 5, '2025 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '신철우/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:47:18', 7, '2024 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '강수형/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:10:45', 1, '2024 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '김진/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:37:14', 1, '2024 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '최선규/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:47:13', 3, '2023 JTBC 서울 마라톤'
FROM profiles 
WHERE nickname LIKE '박재명/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:45:20', 2, '2025 서울레이스'
FROM profiles 
WHERE nickname LIKE '한승혜/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:52:04', 7, '2025 대구국제마라톤'
FROM profiles 
WHERE nickname LIKE '신혜진/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:28:09', 5, '2025 동아마라톤'
FROM profiles 
WHERE nickname LIKE '윤정훈/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:24:33', 3, '2025 동아마라톤'
FROM profiles 
WHERE nickname LIKE '조동호/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:38:01', 2, '2024 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '김기섭/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:20:12', 7, '2024 동아마라톤'
FROM profiles 
WHERE nickname LIKE '이용훈/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:33:09', 2, '2024 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '손민아/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:12:40', 1, '2024 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '김민주/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:21:53', 2, '2024 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '이광희/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:24:51', 5, '2025 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '정승현/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:17:49', 2, '2024 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '조주환/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:55:00', 3, '2024 서울마라톤'
FROM profiles 
WHERE nickname LIKE '김현경/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:35:48', 3, '2024 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '신동인/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:51:46', 2, '2026 대구마라톤'
FROM profiles 
WHERE nickname LIKE '이지수/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:52:31', 3, '2024 서울마라톤'
FROM profiles 
WHERE nickname LIKE '박성만/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:55:31', 5, '2026 동아마라톤'
FROM profiles 
WHERE nickname LIKE '김은혜/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:06:06', 3, '2024 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '정원석/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:25:39', 4, '2024 서울마라톤'
FROM profiles 
WHERE nickname LIKE '박진하/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:59:50', 8, '2023 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '김가을/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:05:16', 1, '2023 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '이희진/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:28:46', 5, '2026 서울동아마라톤'
FROM profiles 
WHERE nickname LIKE '지해웅/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:56:30', 6, '2023 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '김해인/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '02:59:43', 3, '2024 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '오인석/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:22:08', 5, '2025 동아마라톤'
FROM profiles 
WHERE nickname LIKE '임병진/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:58:26', 9, '2025서울마라톤'
FROM profiles 
WHERE nickname LIKE '허상범/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '02:59:25', 3, '2024 서울국제마라톤'
FROM profiles 
WHERE nickname LIKE '이호길/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:38:28', 10, '2024 경기마라톤'
FROM profiles 
WHERE nickname LIKE '이한규/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '02:57:25', 5, '2025 동아마라톤'
FROM profiles 
WHERE nickname LIKE '이성식/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:38:13', 2, '2024 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '박주하/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:25:58', 3, '2026 서울마라톤'
FROM profiles 
WHERE nickname LIKE '유승관/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:50:07', 1, '2023 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '나정수/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:45:01', 3, '2024 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '김태훈/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:20:15', 2, '2024 서울마라톤'
FROM profiles 
WHERE nickname LIKE '신다은/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:08:48', 2, '2025 JTBC'
FROM profiles 
WHERE nickname LIKE '문지성/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:38:46', 3, '2025 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '전재한/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:13:19', 3, '2023춘첨마라톤'
FROM profiles 
WHERE nickname LIKE '김상일/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:24:57', 4, '2022 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '이민진/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:45:55', 5, '2025 jtbc 마라톤'
FROM profiles 
WHERE nickname LIKE '최우현/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '02:58:56', 5, '2026 서울동아마라톤'
FROM profiles 
WHERE nickname LIKE '김명록/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '02:58:38', 5, '2026 동아마라톤'
FROM profiles 
WHERE nickname LIKE '김윤섭/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:50:48', 3, '2024 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '변지훈/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:49:55', 2, '2025 서울마라톤'
FROM profiles 
WHERE nickname LIKE '주민선/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '02:52:19', 5, '2026 서울마라톤'
FROM profiles 
WHERE nickname LIKE '최광욱/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '02:47:14', 5, '2026 서울동아마라톤'
FROM profiles 
WHERE nickname LIKE '김성룡/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:50:46', 2, '2024 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '장가희/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:49:19', 1, '2024 JTBC 서울마라톤'
FROM profiles 
WHERE nickname LIKE '박준재/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '05:35:53', 1, '2024 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '이아인/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:02:09', 2, '2025 서울마라톤'
FROM profiles 
WHERE nickname LIKE '조창균/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:09:04', 2, '2025 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '고병관/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '05:03:50', 1, '2024 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '하수연/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:20:27', 1, '2024 JTBC Seoul Marathon'
FROM profiles 
WHERE nickname LIKE 'Mallesh/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:51:46', 2, '2024년 동아마라톤'
FROM profiles 
WHERE nickname LIKE '이창/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:12:03', 1, '2024 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '이동규/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:58:12', 1, '2024 제마'
FROM profiles 
WHERE nickname LIKE '김지원/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:13:33', 3, '2025동아마라톤'
FROM profiles 
WHERE nickname LIKE '홍의상/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:23:57', 1, '오사카마라톤'
FROM profiles 
WHERE nickname LIKE '김건호/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '05:20:39', 1, '2024 제18회 충북 음성 반기문 마라톤대회'
FROM profiles 
WHERE nickname LIKE '신홍민/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:54:36', 2, '2026동아마라톤'
FROM profiles 
WHERE nickname LIKE '김혜란/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:46:51', 3, '2025 서울마라톤'
FROM profiles 
WHERE nickname LIKE '김동휘/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:39:31', 1, '2025 서울동아마라톤'
FROM profiles 
WHERE nickname LIKE '이철우/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:28:45', 2, '2025 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '김유환/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:34:22', 3, '2025 서울마라톤'
FROM profiles 
WHERE nickname LIKE '장현우/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:50:09', 1, '2025 동아마라톤'
FROM profiles 
WHERE nickname LIKE '이은지/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:50:42', 1, '2025 서울마라톤'
FROM profiles 
WHERE nickname LIKE '우선화/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:29:56', 3, '2026 서울동아마라톤'
FROM profiles 
WHERE nickname LIKE '박주영/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:45:50', 4, '2025 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '이유나/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:14:38', 1, '2025경주국제마라톤'
FROM profiles 
WHERE nickname LIKE '최설화/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:22:35', 1, '2025 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '이승화/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:56:01', 1, '2025 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '김시온/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:23:55', 1, '2025 춘천마라톤'
FROM profiles 
WHERE nickname LIKE '김준영/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:27:17', 1, '2025 JTBC 서울마라톤'
FROM profiles 
WHERE nickname LIKE '박정민/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:32:45', 2, '2026 서울동아마라톤'
FROM profiles 
WHERE nickname LIKE '김지혜/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:36:58', 1, '2025 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '김지은/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:42:06', 3, '2025 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '정혜유/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:01:14', 1, '2025 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '조하윤/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:51:03', 1, '2025 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '김홍진/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:37:15', 2, '2025 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '조윤상/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:51:12', 1, '2025 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '이엘리/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:15:08', 1, '2025 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '김경철/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:26:53', 1, '2025 JTBC 서울 마라톤'
FROM profiles 
WHERE nickname LIKE '이동복/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:15:07', 1, '2025 JTBC'
FROM profiles 
WHERE nickname LIKE '허은자/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:56:23', 1, '2025 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '한현려/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '02:57:28', 42, '2025 JTBC마라톤'
FROM profiles 
WHERE nickname LIKE '이지훈/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:16:58', 3, '2026 서울마라톤'
FROM profiles 
WHERE nickname LIKE '전인규/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:56:42', 1, '2025 JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '오은지/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:40:01', 1, 'JTBC 마라톤'
FROM profiles 
WHERE nickname LIKE '김성제/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:44:49', 3, '2025손기전평화마라톤'
FROM profiles 
WHERE nickname LIKE '최의룡/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:56:07', 3, '2026 동아마라톤'
FROM profiles 
WHERE nickname LIKE '황예은/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:52:34', 1, '2025 인천마라톤'
FROM profiles 
WHERE nickname LIKE '박인동/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:35:32', 1, '2025인천마라톤'
FROM profiles 
WHERE nickname LIKE '이현우/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:53:54', 1, '2025 인천마라톤'
FROM profiles 
WHERE nickname LIKE '윤태웅/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:19:32', 3, '2026 대구마라톤'
FROM profiles 
WHERE nickname LIKE '구자윤/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:40:49', 1, '2025인천마라톤'
FROM profiles 
WHERE nickname LIKE '이주호/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:53:54', 1, '2025인천마라톤'
FROM profiles 
WHERE nickname LIKE '송태경/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:12:44', 5, '2025김포한강마라톤'
FROM profiles 
WHERE nickname LIKE '김승종/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:32:36', 1, '2026 챌린지레이스'
FROM profiles 
WHERE nickname LIKE '허진/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:29:23', 1, '2026 서울마라톤'
FROM profiles 
WHERE nickname LIKE '정광모/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:31:21', 1, '26 경기마라톤'
FROM profiles 
WHERE nickname LIKE '안종암/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:57:10', 1, '2026 경기마라톤'
FROM profiles 
WHERE nickname LIKE '손석호/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:58:14', 1, '2026 경기마라톤'
FROM profiles 
WHERE nickname LIKE '성시현/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:47:42', 1, '경기마'
FROM profiles 
WHERE nickname LIKE '이충호/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '04:41:12', 1, '2026 경기마라톤'
FROM profiles 
WHERE nickname LIKE '복동현/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '03:53:56', 1, '2026 경기마라톤'
FROM profiles 
WHERE nickname LIKE '문민휘/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;

INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '05:34:31', 1, '2026경기마라톤'
FROM profiles 
WHERE nickname LIKE '조도현/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;
