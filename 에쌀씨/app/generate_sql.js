const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'src/data/marathoners.json');
const marathoners = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let sql = `-- 마라톤 데이터 일괄 마이그레이션 스크립트\n`;
sql += `-- Supabase SQL Editor에서 실행해주세요.\n\n`;

for (const m of marathoners) {
  const pbTimeStr = m.pbTime.split(':').length === 2 ? `00:${m.pbTime}` : m.pbTime;
  let timeInterval = pbTimeStr.padStart(8, '0');
  if (timeInterval.length > 8) timeInterval = pbTimeStr;

  sql += `
INSERT INTO marathon_pbs (user_id, category, record_time, completion_count, event_name)
SELECT id, 'FULL', '${timeInterval}', ${m.count}, '${m.event}'
FROM profiles 
WHERE nickname LIKE '${m.name}/%' 
  AND NOT EXISTS (
    SELECT 1 FROM marathon_pbs mp 
    WHERE mp.user_id = profiles.id AND mp.category = 'FULL'
  )
LIMIT 1;
`;
}

fs.writeFileSync('insert_marathons.sql', sql);
console.log('insert_marathons.sql generated!');
