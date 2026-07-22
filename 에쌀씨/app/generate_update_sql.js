const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'src/data/marathoners.json');
const marathoners = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let sql = `-- 마라톤 데이터 업데이트 (기존 레코드 보완)\n`;
sql += `-- Supabase SQL Editor에서 실행해주세요.\n\n`;

for (const m of marathoners) {
  const pbTimeStr = m.pbTime.split(':').length === 2 ? `00:${m.pbTime}` : m.pbTime;
  let timeInterval = pbTimeStr.padStart(8, '0');
  if (timeInterval.length > 8) timeInterval = pbTimeStr;

  sql += `
-- ${m.name} 님 데이터 업데이트 또는 삽입
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE nickname LIKE '${m.name}/%' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM marathon_pbs WHERE user_id = v_user_id AND category = 'FULL') THEN
      UPDATE marathon_pbs 
      SET 
        completion_count = GREATEST(COALESCE(completion_count, 0), ${m.count}),
        event_name = COALESCE(event_name, '${m.event}')
      WHERE user_id = v_user_id AND category = 'FULL';
    ELSE
      INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
      VALUES (v_user_id, 'FULL', '${timeInterval}', ${m.count}, '${m.event}');
    END IF;
  END IF;
END $$;
`;
}

fs.writeFileSync('update_marathons.sql', sql);
console.log('update_marathons.sql generated!');
