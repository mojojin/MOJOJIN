import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient() as any
    
    // Fetch all lucky draw results
    const { data: draws, error: dErr } = await supabase
      .from('lucky_draw_results')
      .select('*')
      .order('created_at', { ascending: false })

    if (dErr) throw dErr

    return NextResponse.json({
      totalDraws: draws.length,
      draws: draws
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
