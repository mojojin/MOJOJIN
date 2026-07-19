import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GoodsClient from './GoodsClient'

export const dynamic = 'force-dynamic'

export default async function GoodsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <GoodsClient userId={user.id} />
    </main>
  )
}
