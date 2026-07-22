import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envData = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envData.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) envVars[match[1]] = match[2]
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  const dataPath = path.join(process.cwd(), 'src/data/marathoners.json')
  const marathoners = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, nickname')
  
  let inserted = 0
  let existingCount = 0
  let notFound = 0
  for (const m of marathoners) {
    const profile = profiles.find(p => p.nickname && p.nickname.split('/')[0].trim() === m.name)
    if (!profile) {
      notFound++
      continue
    }
    
    const { data: existing } = await supabase.from('marathon_pbs').select('id').eq('user_id', profile.id).eq('category', 'FULL')
    if (existing && existing.length > 0) {
      existingCount++
      continue
    }

    const pbTimeStr = m.pbTime.split(':').length === 2 ? `00:${m.pbTime}` : m.pbTime;
    let timeInterval = pbTimeStr.padStart(8, '0');
    if (timeInterval.length > 8) timeInterval = pbTimeStr;

    await supabase.from('marathon_pbs').insert({
      user_id: profile.id, category: 'FULL', record_time: timeInterval,
      completion_count: m.count, event_name: m.event
    })
    inserted++
  }
  console.log(`Inserted: ${inserted}, Existing: ${existingCount}, Not Found in Profiles: ${notFound}`)
}
migrate()
