import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyRecordsClient from './MyRecordsClient'

export default async function MyRecordsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role === 'WAITING') redirect('/dashboard')

  // 전체 러닝 기록 1회 조회 (Supabase free tier API 절약)
  const { data: allRecords } = await supabase
    .from('running_records')
    .select('id, run_date, distance_km, location_name_snapshot, run_type, is_pacing')
    .eq('user_id', user.id)
    .order('run_date', { ascending: false })

  return (
    <MyRecordsClient
      nickname={(profile as any).nickname || '러너'}
      records={allRecords || []}
    />
  )
}
