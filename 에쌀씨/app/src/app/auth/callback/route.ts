import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  // 카카오/Supabase에서 에러를 넘겨준 경우
  if (error_param) {
    console.error('[AUTH CALLBACK] error:', error_param, error_description)
    return NextResponse.redirect(`${origin}/?error=${error_param}`)
  }

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 세션 교환 성공 → 현재 유저의 profile role 확인
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single() as { data: { role: string } | null; error: unknown }

        // WAITING이면 대기 안내 페이지로
        if (!profile || profile.role === 'WAITING') {
          return NextResponse.redirect(`${origin}/auth/waiting`)
        }
      }

      // 정상 회원 → 대시보드로
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('[AUTH CALLBACK] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`)
    }
  }

  // code도 error도 없는 경우
  return NextResponse.redirect(`${origin}/?error=no_code_received`)
}
