import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getKstDate, formatKstYMD } from '@/utils/date'
import { fetchAllRunningRecords } from '@/utils/survival'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient() as any
    
    // 이번 달 날짜 범위 구하기 (한국 시간 기준)
    const today = getKstDate()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    const startStr = formatKstYMD(startOfMonth)
    const endStr = formatKstYMD(endOfMonth)

    // Fetch all records for the month using the helper
    const records = await fetchAllRunningRecords(
      supabase,
      '*',
      startStr,
      endStr
    )

    // Fetch profiles
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, nickname, created_at, role, is_active')
      .neq('role', 'WAITING')
      .eq('is_active', true)

    if (pErr) throw pErr

    // Map each profile to their July runs
    const data = (profiles || []).map(p => {
      const pRuns = records.filter(r => r.user_id === p.id)
      return {
        nickname: p.nickname,
        role: p.role,
        joinDate: p.created_at,
        runsCount: pRuns.length,
        runs: pRuns.map(r => ({
          run_date: r.run_date,
          distance_km: r.distance_km,
          run_type: r.run_type
        }))
      }
    })

    // Sort by runsCount descending
    data.sort((a, b) => b.runsCount - a.runsCount)

    return NextResponse.json({
      today: today.toISOString(),
      startStr,
      endStr,
      totalRecordsFetched: records.length,
      profiles: data
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
