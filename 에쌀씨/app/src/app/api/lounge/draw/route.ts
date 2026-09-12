import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isAdminRole } from '@/utils/survival'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // 1. 유저 인증 및 관리자 권한 검증
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isAdminRole(profile.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // 2. 요청 바디 데이터 확인
    const body = await request.json()
    const { target_month, winner_user_id, winner_nickname, tickets_count } = body

    if (!target_month || !winner_user_id || !winner_nickname) {
      return NextResponse.json({ error: '필수 추첨 데이터가 누락되었습니다.' }, { status: 400 })
    }

    // 3. DB 저장 (SUPABASE_SERVICE_ROLE_KEY가 있는 경우 RLS 우회 client 사용, 없으면 세션 client 사용)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

    let dbClient: any = supabase
    if (serviceKey) {
      dbClient = createAdminClient(supabaseUrl, serviceKey)
    }

    const { data, error } = await dbClient
      .from('lucky_draw_results')
      .insert({
        target_month,
        winner_user_id,
        winner_nickname,
        tickets_count: tickets_count || 1,
      })
      .select()

    if (error) {
      let extraHint = ''
      if (error.code === '42501') {
        extraHint = ' [조치 필요: Supabase SQL Editor에서 ALTER TABLE public.lucky_draw_results DISABLE ROW LEVEL SECURITY; 실행]'
      }
      return NextResponse.json(
        { error: `DB 저장 실패: ${error.message}${extraHint}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '추첨 결과 저장 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
