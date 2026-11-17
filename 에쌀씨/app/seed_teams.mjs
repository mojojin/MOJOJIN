import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rfhbdwfmreamudgfafxc.supabase.co'
const ANON_KEY = 'sb_publishable_0yWY2n5ye0W5eDmrlE2eRA_Yfe7H0b1'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function testFetchProfiles() {
  const { data: profiles, error } = await supabase.from('profiles').select('id, nickname')
  if (error) {
    console.error('Error fetching profiles:', error)
    return
  }
  console.log(`Fetched ${profiles?.length} profiles`)
}

testFetchProfiles()
