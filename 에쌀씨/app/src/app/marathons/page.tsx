import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MarathonClient from './MarathonClient'

export default async function MarathonsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role === 'WAITING') redirect('/dashboard')

  const isAdmin = (profile as any).role === 'ADMIN'

  // 공식 마라톤 이벤트 조회 (날짜순, 관리자는 전체 조회 가능)
  let query = (supabase as any).from('marathon_events').select('*')
  if (!isAdmin) {
    query = query.eq('is_active', true)
  }
  const { data: events } = await query.order('event_date', { ascending: true })

  // 참가 명단 조회 (프로필 포함)
  const { data: participants } = await (supabase as any)
    .from('marathon_participants')
    .select('*, profiles(nickname), marathon_events(name, event_date)')
    .order('created_at', { ascending: false })

  // 마라톤 개인 최고기록 조회
  const { data: marathonPBs } = await supabase
    .from('marathon_pbs')
    .select('*')
    .eq('user_id', user.id)

  return (
    <MarathonClient
      userId={user.id}
      isAdmin={isAdmin}
      initialEvents={events || []}
      initialParticipants={participants || []}
      initialPBs={marathonPBs || []}
    />
  )
}
