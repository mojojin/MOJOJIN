import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/admin/AdminPanel'
import { getKstDate, formatKstYMD } from '@/utils/date'

export default async function AdminPage() {
  const supabase = (await createClient()) as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // 현재 사용자 프로필 조회 및 ADMIN 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // 이번 달 날짜 범위 구하기 (한국 시간 기준)
  const today = getKstDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  // 모든 프로필 조회
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // 모든 장소 조회 (비활성 포함)
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('created_at', { ascending: false })

  // 이번 달 전체 러닝 기록 조회
  const { data: records } = await supabase
    .from('running_records')
    .select('*')
    .gte('run_date', formatKstYMD(startOfMonth))
    .lte('run_date', formatKstYMD(endOfMonth))
    .order('run_date', { ascending: false })

  return (
    <AdminPanel
      userId={user.id}
      profiles={profiles ?? []}
      locations={locations ?? []}
      records={records ?? []}
    />
  )
}
