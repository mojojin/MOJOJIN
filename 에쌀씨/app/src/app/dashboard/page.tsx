import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

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

  // 이번 달 날짜 범위 구하기 (YYYY-MM-DD)
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const formatDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  // 이번 달 러닝 기록 조회
  const { data: records } = await supabase
    .from('running_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('run_date', formatDate(startOfMonth))
    .lte('run_date', formatDate(endOfMonth))
    .order('run_date', { ascending: false })

  const { data: marathonPBs } = await supabase
    .from('marathon_pbs')
    .select('*')
    .eq('user_id', user.id)

  // 이번 달 회비 상태 조회
  const { data: duesData } = await supabase
    .from('dues')
    .select('*')
    .eq('user_id', user.id)
    .eq('target_month', currentMonthStr)
    .single()

  return (
    <DashboardClient
      userId={user.id}
      initialProfile={profile}
      initialRecords={records ?? []}
      initialMarathonPBs={marathonPBs ?? []}
      initialDues={duesData || null}
    />
  )
}

