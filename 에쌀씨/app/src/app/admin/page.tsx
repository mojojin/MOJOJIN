import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/admin/AdminPanel'
import { getKstDate, formatKstYMD } from '@/utils/date'
import { isAdminRole, fetchAllRunningRecords } from '@/utils/survival'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = (await createClient()) as any

  let user = null
  try {
    const authRes = await supabase.auth.getUser()
    user = authRes?.data?.user
  } catch (e) {
    user = null
  }

  if (!user) {
    redirect('/')
  }

  let profile = null
  try {
    const profileRes = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    profile = profileRes?.data
  } catch (e) {
    profile = null
  }

  if (!profile || !isAdminRole(profile.role)) {
    redirect('/dashboard')
  }

  const today = getKstDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  let profiles: any[] = []
  let locations: any[] = []
  let records: any[] = []

  try {
    const [profilesRes, locationsRes, recordsData] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('locations').select('*').order('created_at', { ascending: false }),
      fetchAllRunningRecords(
        supabase,
        '*',
        formatKstYMD(startOfMonth),
        formatKstYMD(endOfMonth)
      ).catch(() => [])
    ])

    profiles = profilesRes?.data ?? []
    locations = locationsRes?.data ?? []
    records = recordsData ?? []
  } catch (e) {
    profiles = []
    locations = []
    records = []
  }

  return (
    <AdminPanel
      userId={user.id}
      profiles={profiles}
      locations={locations}
      records={records}
    />
  )
}
