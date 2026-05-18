import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, role')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">
          안녕하세요, {profile?.nickname ?? '러너'}님! 👋
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          {profile?.role === 'PACER' ? '🎈 페이서' : profile?.role}
        </p>

        {/* 대시보드 컨텐츠 (추후 구현) */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 text-center text-gray-500">
          월간 생존 대시보드 — 준비 중
        </div>
      </div>
    </main>
  )
}
