import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 (중요: await 필수)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 비로그인 사용자 → 홈(로그인 페이지)으로
  if (!user && pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 로그인된 사용자의 role 확인
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // 이미 로그인된 상태에서 루트 접근 시 → 대시보드로
    if (pathname === '/') {
      if (profile?.role === 'WAITING' || !profile?.is_active) {
        return NextResponse.redirect(new URL('/auth/waiting', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // WAITING 상태는 /auth/waiting 이외 접근 차단
    if (
      (profile?.role === 'WAITING' || !profile?.is_active) &&
      pathname !== '/auth/waiting'
    ) {
      return NextResponse.redirect(new URL('/auth/waiting', request.url))
    }
  }

  return supabaseResponse
}
