import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase 환경 변수가 없습니다.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const fileContent = fs.readFileSync('locations_data.md', 'utf-8')
  
  // Split by URL header
  const blocks = fileContent.split(/--- URL: .*? ---/).filter(b => b.trim())
  
  for (const block of blocks) {
    if (!block.includes('모이는 장소')) continue

    const lines = block.split('\n').map(l => l.trim())
    
    let name = ''
    let address = ''
    let parking_info = ''
    let map_url = ''

    // Find Name (either from ## or from lines before "러닝 코스" or "모이는 장소")
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## ')) {
        name = lines[i].replace('## ', '').trim()
        break
      }
    }

    if (!name) {
      // Look for the name right after [에쌀씨 (SUWON RUNNING CREW)]
      const index = lines.findIndex(l => l.includes('[에쌀씨 (SUWON RUNNING CREW)]'))
      if (index !== -1 && lines[index+4]) {
        name = lines[index+4].trim()
      }
    }
    
    if (!name) {
       // if still no name, try finding text before '러닝 코스'
       const runCourse = lines.findIndex(l => l.includes('러닝 코스'))
       if(runCourse > 5) {
         name = lines[runCourse - 4].replace('## ', '').trim()
       }
    }

    // Find Address
    const addressIndex = lines.findIndex(l => l.includes('모이는 장소'))
    if (addressIndex !== -1) {
      for(let i = addressIndex + 1; i < lines.length; i++) {
        if(lines[i] && !lines[i].startsWith('![') && !lines[i].includes('지도 보기')) {
          address = lines[i].trim()
          break
        }
      }
    }

    // Find Parking
    const parkingIndex = lines.findIndex(l => l.includes('주차 정보') || l.includes('주차장'))
    if (parkingIndex !== -1) {
      let parkingLines = []
      for(let i = parkingIndex + 1; i < lines.length; i++) {
        if(lines[i].startsWith('↩️') || lines[i].includes('메인 페이지로 가기')) break
        if(lines[i] && !lines[i].startsWith('![')) {
          parkingLines.push(lines[i].trim())
        }
      }
      parking_info = parkingLines.join('\n').trim()
    }

    // Extract Map URL from parking or address (naver/kakao links)
    const urlRegex = /(https?:\/\/(?:naver\.me|kko\.to)[^\s)]+)/
    const mapMatch = (parking_info + '\n' + address).match(urlRegex)
    if (mapMatch) {
      map_url = mapMatch[1]
    }
    
    // Final clean up
    if(name === '수원시 팔달구 팔달산로 318') name = '팔달산 둘레길'
    if(!name && address.includes('팔달산')) name = '팔달산 둘레길'
    if(!name && address.includes('광교호수공원제1주차장')) name = '광교호수공원 (원천호수)'
    if(name === '영통중앙공원+영흥숲공원') name = '영통중앙공원'

    if (!name) {
      console.log(`Could not find name, skipping block...`)
      continue
    }

    console.log(`[Extracted] Name: ${name}`)
    console.log(`[Extracted] Address: ${address}`)
    console.log(`[Extracted] Parking: ${parking_info}`)
    console.log(`[Extracted] Map URL: ${map_url}\n`)

    // Upsert logic
    const { data: existing } = await supabase
      .from('locations')
      .select('id, name')
      .ilike('name', `%${name}%`)
      .single()

    if (existing) {
      console.log(`Updating existing location: ${existing.name}`)
      await supabase
        .from('locations')
        .update({
          address: address || null,
          parking_info: parking_info || null,
          map_url: map_url || null
        })
        .eq('id', existing.id)
    } else {
      console.log(`Inserting new location: ${name}`)
      await supabase
        .from('locations')
        .insert({
          name,
          address: address || null,
          parking_info: parking_info || null,
          map_url: map_url || null,
          is_active: true
        })
    }
  }
  
  console.log('All parsing and inserting completed!')
}

run()
