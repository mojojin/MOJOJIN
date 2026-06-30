import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { getKstDate, formatKstYMD } from '@/utils/date'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // 프로필 정보 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/')
  }

  // 이번 달 날짜 범위 구하기 (YYYY-MM-DD, 한국 시간 기준)
  const today = getKstDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  // 이번 달 러닝 기록 조회
  const { data: records } = await supabase
    .from('running_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('run_date', formatKstYMD(startOfMonth))
    .lte('run_date', formatKstYMD(endOfMonth))
    .order('run_date', { ascending: false })


  // 이번 달 회비 상태 조회
  const { data: duesData } = await supabase
    .from('dues')
    .select('*')
    .eq('user_id', user.id)
    .eq('target_month', currentMonthStr)
    .single()

  // 전체 누적 달리기 거리 조회
  const { data: allRecordsRaw } = await supabase
    .from('running_records')
    .select('distance_km')
    .eq('user_id', user.id)

  const totalDistanceKm = (allRecordsRaw || []).reduce(
    (sum, r) => sum + parseFloat(String((r as any).distance_km || 0)),
    0
  )

  return (
    <DashboardClient
      userId={user.id}
      initialProfile={profile}
      initialRecords={records ?? []}
      initialDues={duesData || null}
      totalDistanceKm={totalDistanceKm}
    />
  )
}

