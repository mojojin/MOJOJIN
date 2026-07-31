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
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function query() {
  // Try to find the user 이승화 in running_records or profiles
  console.log('Querying running_records for July 2026...')
  const { data: runs, error } = await supabase
    .from('running_records')
    .select('*')
    .gte('run_date', '2026-07-01')
    .lte('run_date', '2026-07-31')
    .limit(5000)

  if (error) {
    console.error('Error fetching runs:', error)
    return
  }

  console.log(`Fetched ${runs?.length || 0} runs in total.`)

  // Let's find user_ids and their total distances
  const userDistances = {}
  runs.forEach(r => {
    userDistances[r.user_id] = (userDistances[r.user_id] || 0) + parseFloat(r.distance_km)
  })

  // Let's try to fetch active profiles if RLS allows
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, nickname')
    .limit(1000)

  if (pError) {
    console.log('Could not fetch profiles due to RLS, trying to guess from snaps...')
  } else {
    console.log(`Fetched ${profiles.length} profiles.`)
    const targetProfile = profiles.find(p => p.nickname?.includes('이승화'))
    if (targetProfile) {
      console.log('Found 이승화 profile:', targetProfile)
      console.log('Runs count for 이승화 in July:', runs.filter(r => r.user_id === targetProfile.id).length)
      console.log('Total distance for 이승화 in July runs:', userDistances[targetProfile.id])
      console.log('List of runs for 이승화 in July:')
      console.log(runs.filter(r => r.user_id === targetProfile.id).map(r => `${r.run_date}: ${r.distance_km} km (${r.run_type})`))
    } else {
      console.log('Profile 이승화 not found in profiles.')
    }
  }
}

query()
