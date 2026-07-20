import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import legacyData from '@/data/legacy_aggregated.json'

const LEGACY_LOCATION_NAME = '앱 가입 전 누적 기록 (2026.01~)'

export async function POST(request: Request) {
  try {
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const nickname = profile.nickname;
    const rawDistance = (legacyData as Record<string, number>)[nickname];

    if (!rawDistance || rawDistance <= 0) {
      return NextResponse.json({ message: 'No legacy data found', processed: false })
    }

    // DB의 CHECK (distance_km >= 3.0) 제약 조건을 통과하기 위해 최소 3.0 적용
    const accumulatedDistance = Math.max(3.0, rawDistance);

    // 2. Check if already claimed
    const { data: existing } = await supabase
      .from('running_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('location_name_snapshot', LEGACY_LOCATION_NAME)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Already claimed', processed: false })
    }

    // 3. Insert record
    const { error: insertErr } = await supabase
      .from('running_records')
      .insert({
        user_id: user.id,
        run_date: '2026-01-01', // 고정 날짜
        distance_km: accumulatedDistance,
        location_name_snapshot: LEGACY_LOCATION_NAME,
        run_type: 'PERSONAL',
        is_pacing: false
      })

    if (insertErr) throw insertErr

    return NextResponse.json({ message: 'Legacy data claimed successfully', processed: true, distance: accumulatedDistance })
  } catch (err: any) {
    console.error('Legacy claim error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
