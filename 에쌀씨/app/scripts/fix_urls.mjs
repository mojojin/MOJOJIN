import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function fix() {
  const { data } = await supabase.from('locations').select('id, map_url, parking_info')
  for (const l of data) {
    let updates = {}
    if (l.map_url && l.map_url.includes('](')) {
      updates.map_url = l.map_url.split('](')[0]
    }
    // Also clean up markdown links in parking info if possible
    if (l.parking_info && l.parking_info.includes('](')) {
      updates.parking_info = l.parking_info.replace(/\[(https?:\/\/[^\]]+)\]\([^)]+\)/g, '$1')
    }
    
    if (Object.keys(updates).length > 0) {
      await supabase.from('locations').update(updates).eq('id', l.id)
      console.log('Fixed', l.id, updates)
    }
  }
}
fix()
