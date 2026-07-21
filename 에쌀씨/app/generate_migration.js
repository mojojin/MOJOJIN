const fs = require('fs');
const profiles = JSON.parse(fs.readFileSync('profiles.json', 'utf8'));
const marathoners = JSON.parse(fs.readFileSync('./src/data/marathoners.json', 'utf8'));

// map nickname to id
const nameToId = {};
profiles.forEach(p => nameToId[p.nickname] = p.id);

let sql = `-- Marathon PB Initial Migration\n\n`;

let matchCount = 0;
marathoners.forEach(m => {
  const id = nameToId[m.name];
  if (id) {
    matchCount++;
    const pbTime = m.pbTime.split(':').length === 2 ? `00:${m.pbTime}` : m.pbTime; // Format fixing
    let timeInterval = pbTime.padStart(8, '0');
    if (timeInterval.length > 8) {
      timeInterval = pbTime; // just in case
    }
    
    // Convert to standard INTERVAL format (HH:MM:SS)
    sql += `INSERT INTO public.marathon_pbs (user_id, category, record_time, achieved_at, completion_count, event_name, motto)
VALUES ('${id}', 'FULL', '${timeInterval}'::interval, NULL, ${m.count}, '${m.event.replace(/'/g, "''")}', NULL)
ON CONFLICT (user_id, category) 
DO UPDATE SET 
  record_time = EXCLUDED.record_time,
  completion_count = EXCLUDED.completion_count,
  event_name = EXCLUDED.event_name;\n`;
  }
});

fs.writeFileSync('marathon_migration.sql', sql);
console.log(`Matched ${matchCount} out of ${marathoners.length} marathoners.`);
