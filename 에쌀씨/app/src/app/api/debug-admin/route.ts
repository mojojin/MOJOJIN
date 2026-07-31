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
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname')

    // Find 전언범 and 성진혁 profiles
    const jeon = profiles?.find(p => p.nickname?.includes('전언범'))
    const seong = profiles?.find(p => p.nickname?.includes('성진혁'))
    const kyeong = profiles?.find(p => p.nickname?.includes('경지욱'))

    const jeonRuns = records.filter(r => r.user_id === jeon?.id)
    const seongRuns = records.filter(r => r.user_id === seong?.id)
    const kyeongRuns = records.filter(r => r.user_id === kyeong?.id)

    return NextResponse.json({
      today: today.toISOString(),
      startStr,
      endStr,
      totalRecordsFetched: records.length,
      jeon: {
        id: jeon?.id,
        nickname: jeon?.nickname,
        runsCount: jeonRuns.length,
        runs: jeonRuns.map(r => ({ run_date: r.run_date, distance_km: r.distance_km, run_type: r.run_type }))
      },
      seong: {
        id: seong?.id,
        nickname: seong?.nickname,
        runsCount: seongRuns.length,
        runs: seongRuns.map(r => ({ run_date: r.run_date, distance_km: r.distance_km, run_type: r.run_type }))
      },
      kyeong: {
        id: kyeong?.id,
        nickname: kyeong?.nickname,
        runsCount: kyeongRuns.length,
        runs: kyeongRuns.map(r => ({ run_date: r.run_date, distance_km: r.distance_km, run_type: r.run_type }))
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
