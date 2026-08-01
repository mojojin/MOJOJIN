import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient() as any
    
    // Test July 2026 dates
    const selectedMonth = '2026-07'
    const [year, month] = selectedMonth.split('-').map(Number)
    const targetDate = new Date(year, month - 1, 1)
    const targetYear = targetDate.getFullYear()
    const targetMonthVal = String(targetDate.getMonth() + 1).padStart(2, '0')
    const targetMonthStr = `${targetYear}-${targetMonthVal}`

    const startOfPrevMonth = `${targetMonthStr}-01`
    const endDayOfPrevMonth = new Date(targetYear, targetDate.getMonth() + 1, 0).getDate()
    const endOfPrevMonth = `${targetMonthStr}-${String(endDayOfPrevMonth).padStart(2, '0')}`

    // 1. Fetch profiles
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, nickname')

    const profileMap: Record<string, string> = {}
    for (const p of allProfiles || []) {
      profileMap[p.id] = p.nickname
    }

    // 2. Fetch regular runs in July 2026
    const { data: records, error: rErr } = await supabase
      .from('running_records')
      .select('*')
      .eq('run_type', 'REGULAR')
      .gte('run_date', startOfPrevMonth)
      .lte('run_date', endOfPrevMonth)

    if (rErr) throw rErr

    // 3. Count
    const countMap: Record<string, { count: number; nickname: string }> = {}
    for (const r of records || []) {
      const uid = r.user_id
      if (!countMap[uid]) {
        countMap[uid] = { count: 0, nickname: profileMap[uid] || '러너' }
      }
      countMap[uid].count++
    }

    // 4. Pool
    const pool: { userId: string; nickname: string; tickets: number }[] = []
    for (const [uid, info] of Object.entries(countMap)) {
      const tickets = info.count
      if (tickets > 0) pool.push({ userId: uid, nickname: info.nickname, tickets })
    }

    return NextResponse.json({
      targetMonthStr,
      startOfPrevMonth,
      endOfPrevMonth,
      totalRegularRecords: records?.length || 0,
      records: records,
      pool: pool
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
