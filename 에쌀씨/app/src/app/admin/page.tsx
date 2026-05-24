import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/admin/AdminPanel'

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

  // 이번 달 날짜 범위 구하기
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const formatDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

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
    .gte('run_date', formatDate(startOfMonth))
    .lte('run_date', formatDate(endOfMonth))
    .order('run_date', { ascending: false })

  return (
    <AdminPanel
      profiles={profiles ?? []}
      locations={locations ?? []}
      records={records ?? []}
    />
  )
}
