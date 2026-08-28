import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  try {
    // Next.js RSC prefetch 요청인 경우 무거운 Supabase DB 조회를 우회시켜 성능 극대화
    const isPrefetch =
      request.headers.get('purpose') === 'prefetch' ||
      request.headers.get('x-middleware-prefetch') === '1'

    if (isPrefetch) {
      return supabaseResponse
    }

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

    // 공개 라우트 (인증 없이 접근 및 콜백 처리 가능해야 하는 경로)
    const isPublicRoute =
      pathname === '/' ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/about')

    // 비로그인 사용자 → 공개 라우트가 아니면 홈으로 이동
    if (!user && !isPublicRoute) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // 로그인된 사용자의 role 확인
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle()

      // 이미 로그인된 상태에서 루트 접근 시 → 대시보드로
      if (pathname === '/') {
        if (profile && (profile.role === 'WAITING' || !profile.is_active)) {
          return NextResponse.redirect(new URL('/auth/waiting', request.url))
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // WAITING 상태는 /auth/waiting 이외 접근 차단 (공개 라우트 제외)
      if (
        profile &&
        (profile.role === 'WAITING' || !profile.is_active) &&
        !pathname.startsWith('/auth') &&
        !pathname.startsWith('/api')
      ) {
        return NextResponse.redirect(new URL('/auth/waiting', request.url))
      }

      // 승인된 회원(REGULAR, PACER, ADMIN)이 대기 페이지(/auth/waiting)에 머물 경우 → 대시보드로 자동 리다이렉트
      if (
        profile?.role !== 'WAITING' &&
        profile?.is_active &&
        pathname === '/auth/waiting'
      ) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  } catch (err) {
    // 미들웨어 내부 예외 발생 시 500 에러 화면을 띄우지 않고 기본 통과 처리
    return supabaseResponse
  }

  return supabaseResponse
}
