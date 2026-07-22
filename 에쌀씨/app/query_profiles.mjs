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

async function query() {
  const { data: profiles } = await supabase.from('profiles').select('nickname').limit(10)
  console.log('Profiles in DB:', profiles)
}
query()
