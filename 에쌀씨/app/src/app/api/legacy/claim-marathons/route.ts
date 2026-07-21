import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import marathonersData from '@/data/marathoners.json'

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
    
    // Find matching marathoner data
    const marathonData = (marathonersData as any[]).find(m => m.name === nickname);

    if (!marathonData) {
      return NextResponse.json({ message: 'No legacy marathon data found', processed: false })
    }

    // 2. Check if already claimed
    const { data: existing } = await supabase
      .from('marathon_pbs')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', 'FULL')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Already claimed', processed: false })
    }

    // Format PB time properly to INTERVAL
    const pbTimeStr = marathonData.pbTime.split(':').length === 2 ? `00:${marathonData.pbTime}` : marathonData.pbTime;
    let timeInterval = pbTimeStr.padStart(8, '0');
    if (timeInterval.length > 8) {
      timeInterval = pbTimeStr;
    }

    // 3. Insert record
    const { error: insertErr } = await supabase
      .from('marathon_pbs')
      .insert({
        user_id: user.id,
        category: 'FULL',
        record_time: timeInterval,
        achieved_at: null, // Legacy data didn't track date
        completion_count: marathonData.count,
        event_name: marathonData.event,
        motto: null
      })

    if (insertErr) throw insertErr

    return NextResponse.json({ message: 'Legacy marathon data claimed successfully', processed: true, count: marathonData.count })
  } catch (err: any) {
    console.error('Legacy marathon claim error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
