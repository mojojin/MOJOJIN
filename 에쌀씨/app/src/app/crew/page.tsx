import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CrewDashboardClient from './CrewDashboardClient'

export default async function CrewPage() {
  const supabase = (await createClient()) as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 본인 프로필 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // WAITING(대기) 상태이거나 비활성 회원이면 접근 불가
  if (!profile || profile.role === 'WAITING' || !profile.is_active) {
    redirect('/dashboard')
  }

  return <CrewDashboardClient userId={user.id} userRole={profile.role} />
}
