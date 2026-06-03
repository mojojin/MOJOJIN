import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuggestionClient from './SuggestionClient'

export default async function SuggestionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return <SuggestionClient userId={user.id} />
}
