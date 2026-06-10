import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GpxClient from './GpxClient'

export default async function GpxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!profile || (profile as any).role === 'WAITING') redirect('/dashboard')

  const { data: gpxCourses } = await (supabase as any)
    .from('gpx_courses')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <GpxClient
      userId={user.id}
      isAdmin={(profile as any).role === 'ADMIN'}
      initialGpxCourses={gpxCourses || []}
    />
  )
}
