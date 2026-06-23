import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/legacy/check?name=장지윤
// 현재 유저 이름으로 미이관 레거시 기록 건수/목록 조회
export async function GET(request: Request) {
  try {
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ count: 0, records: [] })

    const { data: records, error } = await supabase
      .from('legacy_records')
      .select('id, name, birth_year, run_type, run_date, distance_km, location_name, is_pacing')
      .eq('name', profile.nickname)
      .eq('migrated', false)
      .order('run_date', { ascending: true })

    if (error) throw error

    return NextResponse.json({ count: records?.length ?? 0, records: records ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/legacy/check  → 실제 이관 실행
export async function POST(request: Request) {
  try {
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // 미이관 레거시 기록 조회
    const { data: legacyRecords, error: fetchErr } = await supabase
      .from('legacy_records')
      .select('*')
      .eq('name', profile.nickname)
      .eq('migrated', false)

    if (fetchErr) throw fetchErr
    if (!legacyRecords || legacyRecords.length === 0) {
      return NextResponse.json({ migrated: 0 })
    }

    // running_records에 삽입
    const toInsert = legacyRecords.map((r: any) => ({
      user_id: user.id,
      run_date: r.run_date,
      distance_km: r.distance_km,
      location_name_snapshot: r.location_name || '기타',
      run_type: r.run_type as 'PERSONAL' | 'REGULAR',
      is_pacing: r.is_pacing ?? false,
    }))

    const { error: insertErr } = await supabase
      .from('running_records')
      .insert(toInsert)

    if (insertErr) throw insertErr

    // legacy_records를 migrated = true 처리
    const ids = legacyRecords.map((r: any) => r.id)
    await supabase
      .from('legacy_records')
      .update({ migrated: true, migrated_user_id: user.id, migrated_at: new Date().toISOString() })
      .in('id', ids)

    return NextResponse.json({ migrated: legacyRecords.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
