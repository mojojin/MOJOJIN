import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Service role client bypasses RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: draws, error: dErr } = await supabase
      .from('lucky_draw_results')
      .select('*')
      .order('created_at', { ascending: false })

    if (dErr) throw dErr

    return NextResponse.json({
      usingServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      totalDraws: draws?.length || 0,
      draws: draws
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
