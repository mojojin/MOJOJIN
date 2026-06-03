import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MarathonClient from './MarathonClient'

export default async function MarathonsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return <MarathonClient userId={user.id} />
}
