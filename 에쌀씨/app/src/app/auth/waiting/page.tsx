import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WaitingClient from '@/components/auth/WaitingClient'

export default async function WaitingPage() {
  const supabase = (await createClient()) as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, phone, nickname')
    .eq('id', user.id)
    .single()

  // 이미 승인된 회원이면 대시보드로
  if (profile && profile.role !== 'WAITING' && profile.is_active) {
    redirect('/dashboard')
  }

  return (
    <WaitingClient
      userId={user.id}
      initialPhone={profile?.phone ?? null}
      nickname={profile?.nickname ?? '러너'}
    />
  )
}
