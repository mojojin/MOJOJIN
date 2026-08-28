import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/admin/AdminPanel'
import { getKstDate, formatKstYMD } from '@/utils/date'
import { isAdminRole, fetchAllRunningRecords } from '@/utils/survival'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = (await createClient()) as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 1. 현재 사용자 프로필 조회 및 ADMIN 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !isAdminRole(profile.role)) {
    redirect('/dashboard')
  }

  // 2. 관리자 데이터 안전 조회 (redirect 구문과 분리)
  const today = getKstDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const [profilesRes, locationsRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('locations').select('*').order('created_at', { ascending: false })
  ])

  let records: any[] = []
  try {
    records = await fetchAllRunningRecords(
      supabase,
      '*',
      formatKstYMD(startOfMonth),
      formatKstYMD(endOfMonth)
    )
  } catch (e) {
    records = []
  }

  return (
    <AdminPanel
      userId={user.id}
      profiles={profilesRes.data ?? []}
      locations={locationsRes.data ?? []}
      records={records ?? []}
    />
  )
}
