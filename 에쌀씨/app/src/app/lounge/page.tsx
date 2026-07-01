import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getKstMonthStr } from '@/utils/date'
import { isAdminRole } from '@/utils/survival'
import LoungeClient from './LoungeClient'

export default async function LoungePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role === 'WAITING') redirect('/dashboard')

  const isAdmin = isAdminRole((profile as any).role)

  // 이번 달 추첨 결과 조회 (한국 시간 기준)
  const currentMonthStr = getKstMonthStr()
  const { data: drawResults } = await (supabase as any)
    .from('lucky_draw_results')
    .select('*')
    .eq('target_month', currentMonthStr)
    .order('created_at', { ascending: true })

  return (
    <LoungeClient
      userId={user.id}
      userNickname={(profile as any).nickname}
      isAdmin={isAdmin}
      initialDrawResults={drawResults || []}
      currentMonth={currentMonthStr}
    />
  )
}
