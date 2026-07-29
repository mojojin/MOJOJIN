import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuggestionClient from './SuggestionClient'

export default async function SuggestionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'WAITING' || !profile.is_active) redirect('/')

  return <SuggestionClient userId={user.id} />
}
