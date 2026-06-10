import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  const isAdmin = (profile as any).role === 'ADMIN'

  // 이번 달 추첨 결과 조회
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const { data: drawResults } = await (supabase as any)
    .from('lucky_draw_results')
    .select('*')
    .eq('target_month', currentMonthStr)
    .order('created_at', { ascending: true })

  // GPX 코스 목록 조회
  const { data: gpxCourses } = await (supabase as any)
    .from('gpx_courses')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <LoungeClient
      userId={user.id}
      userNickname={(profile as any).nickname}
      isAdmin={isAdmin}
      initialDrawResults={drawResults || []}
      initialGpxCourses={gpxCourses || []}
      currentMonth={currentMonthStr}
    />
  )
}
