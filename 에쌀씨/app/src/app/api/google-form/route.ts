import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/google-form
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    // 간단한 토큰 인증 (보안용)
    const secretToken = process.env.GOOGLE_FORM_SECRET || 'src-secret-form-token'
    if (token !== secretToken) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      claimant_name,
      claimant_phone,
      category,
      description,
      amount,
      expense_date,
      bank_account,
      receipt_image_url
    } = body

    if (!claimant_name || !category || !description || !amount || !expense_date || !bank_account) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 서비스 롤 키로 Supabase 클라이언트 생성 (RLS 우회)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        claimant_name: claimant_name.trim(),
        claimant_phone: claimant_phone ? claimant_phone.trim() : null,
        category: category.trim(),
        description: description.trim(),
        amount: Number(amount),
        expense_date: expense_date.trim(),
        bank_account: bank_account.trim(),
        receipt_image_url: receipt_image_url ? receipt_image_url.trim() : null,
        status: 'PENDING'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Google Form Sync Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
