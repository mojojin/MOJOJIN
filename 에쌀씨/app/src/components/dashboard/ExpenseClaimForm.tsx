'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ExpenseClaimFormProps {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function ExpenseClaimForm({ userId, onClose, onSuccess }: ExpenseClaimFormProps) {
  const supabase = createClient()
  
  const [category, setCategory] = useState('정기런')
  const [expenseDate, setExpenseDate] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseDate || !amount || !description || !bankAccount || !file) {
      return setErrorMsg('모든 항목을 입력하고 영수증 사진을 첨부해 주세요.')
    }
    
    setIsSubmitting(true)
    setErrorMsg('')
    
    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const randomId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
      const fileName = `${userId}_${randomId}.${fileExt}`
      const filePath = `receipts/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      // 2. Insert into expenses table
      const { error: dbError } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          category,
          expense_date: expenseDate,
          amount: parseInt(amount, 10),
          description,
          bank_account: bankAccount,
          receipt_image_url: publicUrl,
          status: 'PENDING'
        })

      if (dbError) throw dbError

      alert('비용 청구가 성공적으로 접수되었습니다.')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setErrorMsg('청구 처리 중 오류가 발생했습니다. (Storage 설정 확인 필요)')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-900/90 p-6 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-xl font-bold text-white">💸 비용 청구하기</h3>
        <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-400">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">카테고리</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white h-11">
              <option value="정기런">정기런</option>
              <option value="이벤트런">이벤트런</option>
              <option value="대회지원">대회지원</option>
              <option value="비품/기타">비품/기타</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">결제일</label>
            <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white h-11 [color-scheme:dark]" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">상세 내역</label>
          <input type="text" placeholder="예: 수요정기런 음료수 및 간식" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white h-11" />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">청구 금액 (원)</label>
          <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-lg font-bold text-white h-12" />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">입금 받을 계좌번호</label>
          <input type="text" placeholder="카카오뱅크 3333-12-3456 홍길동" value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white h-11" />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">영수증 사진 (필수)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-extrabold text-sm rounded-xl hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all disabled:opacity-50">
          {isSubmitting ? '영수증 업로드 중...' : '지출 청구 완료하기'}
        </button>
      </form>
    </div>
  )
}
