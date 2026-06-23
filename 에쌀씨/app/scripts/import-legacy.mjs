#!/usr/bin/env node
/**
 * SRC 레거시 기록 임포트 스크립트
 *
 * 사용법:
 *   1. 구글 시트 → 파일 → 다운로드 → TSV(탭 구분 텍스트) 로 저장
 *   2. 아래 .env.local 값 확인 (SUPABASE_SERVICE_KEY 필요)
 *   3. node scripts/import-legacy.mjs <파일경로.tsv>
 *
 * 예시: node scripts/import-legacy.mjs ~/Downloads/records.tsv
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// .env.local 로드
config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ .env.local 에서 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 를 확인하세요.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── 날짜 파싱: "2026. 1. 5" → "2026-01-05" ──────────────────────────
function parseDate(raw) {
  if (!raw) return null
  const cleaned = raw.trim().replace(/\s+/g, ' ')
  // "2026. 1. 5" 또는 "2026.1.5"
  const m = cleaned.match(/(\d{4})[.\s]+(\d{1,2})[.\s]+(\d{1,2})/)
  if (!m) return null
  const [, y, mo, d] = m
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

// ── 장소 파싱: "수원천 / Suwon stream" → "수원천" ─────────────────────
function parseLocation(raw) {
  if (!raw) return ''
  return raw.split('/')[0].trim()
}

// ── 런 타입 파싱 ─────────────────────────────────────────────────────
function parseRunType(raw) {
  if (!raw) return 'PERSONAL'
  return raw.includes('정기런') ? 'REGULAR' : 'PERSONAL'
}

// ── 행 파싱 ──────────────────────────────────────────────────────────
function parseLine(line) {
  const cols = line.split('\t')
  if (cols.length < 5) return null

  const submittedRaw = cols[0]?.trim()
  const nameInfo    = cols[1]?.trim() // "장지윤/95/여"
  const runTypeRaw  = cols[2]?.trim()
  const runDateRaw  = cols[3]?.trim()
  const distRaw     = cols[4]?.trim()
  const locationRaw = cols[5]?.trim()
  const col6        = cols[6]?.trim() // "네" or number or empty

  if (!nameInfo || !runDateRaw || !distRaw) return null

  const nameParts = nameInfo.split('/')
  const name       = nameParts[0]?.trim()
  const birthYear  = nameParts[1]?.trim()
  const gender     = nameParts[2]?.trim()

  if (!name) return null

  const runDate   = parseDate(runDateRaw)
  if (!runDate) return null

  const distNum = parseFloat(distRaw.replace(/,/g, ''))
  if (isNaN(distNum) || distNum <= 0) return null

  // 페이서: col6 === "네"
  const isPacing = col6 === '네'

  // submitted_at: "2026. 1. 1 오전 7:27:06" 파싱 시도
  let submittedAt = null
  try {
    const dtm = submittedRaw?.match(
      /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\s+(오전|오후)\s+(\d{1,2}):(\d{2}):(\d{2})/
    )
    if (dtm) {
      let [, y, mo, d, ampm, h, min, sec] = dtm
      let hour = parseInt(h, 10)
      if (ampm === '오후' && hour !== 12) hour += 12
      if (ampm === '오전' && hour === 12) hour = 0
      submittedAt = new Date(
        parseInt(y), parseInt(mo) - 1, parseInt(d),
        hour, parseInt(min), parseInt(sec)
      ).toISOString()
    }
  } catch (_) {}

  return {
    name,
    birth_year:   birthYear || null,
    gender:       gender || null,
    run_type:     parseRunType(runTypeRaw),
    run_date:     runDate,
    distance_km:  distNum,
    location_name: parseLocation(locationRaw),
    is_pacing:    isPacing,
    submitted_at: submittedAt,
  }
}

// ── 메인 ─────────────────────────────────────────────────────────────
async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('사용법: node scripts/import-legacy.mjs <파일.tsv>')
    process.exit(1)
  }

  const raw = fs.readFileSync(path.resolve(filePath), 'utf-8')
  const lines = raw.split('\n').filter(l => l.trim())

  // 첫 줄이 헤더인지 확인 (타임스탬프가 없으면 헤더)
  let startIdx = 0
  if (lines[0] && !lines[0].match(/^\d{4}/)) {
    console.log(`헤더 스킵: ${lines[0].substring(0, 60)}...`)
    startIdx = 1
  }

  const records = []
  let skipped = 0

  for (let i = startIdx; i < lines.length; i++) {
    const parsed = parseLine(lines[i])
    if (parsed) {
      records.push(parsed)
    } else {
      skipped++
    }
  }

  console.log(`\n파싱 완료: ${records.length}건 유효 / ${skipped}건 스킵`)

  if (records.length === 0) {
    console.log('삽입할 데이터가 없습니다.')
    return
  }

  // 배치 삽입 (500건씩)
  const BATCH = 500
  let inserted = 0

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const { error } = await supabase.from('legacy_records').insert(batch)
    if (error) {
      console.error(`❌ 배치 ${Math.floor(i / BATCH) + 1} 오류:`, error.message)
    } else {
      inserted += batch.length
      console.log(`✅ ${inserted} / ${records.length} 건 삽입 완료`)
    }
  }

  console.log(`\n🎉 임포트 완료: 총 ${inserted}건 삽입`)
}

main().catch(console.error)
