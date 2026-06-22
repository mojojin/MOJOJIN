'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ExpenseClaimFormProps {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

const KOREAN_BANKS = [
  '선택해 주세요',
  'NH농협',
  'KB국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  '카카오뱅크',
  '토스뱅크',
  'IBK기업은행',
  '새마을금고',
  '우체국',
  '신협',
  '수협',
  'KDB산업은행',
  'SC제일은행',
  '대구은행(iM뱅크)',
  '부산은행',
  '경남은행',
  '광주은행',
  '전북은행',
  '제주은행',
]

export default function ExpenseClaimForm({ userId, onClose, onSuccess }: ExpenseClaimFormProps) {
  const supabase = createClient() as any
  
  const [category, setCategory] = useState('정기런')
  const [expenseDate, setExpenseDate] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const originalOverflow = document.documentElement.style.overflow
    const originalOverscroll = document.documentElement.style.overscrollBehavior
    const originalBodyOverflow = document.body.style.overflow
    const originalBodyOverscroll = document.body.style.overscrollBehavior

    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.documentElement.style.overflow = originalOverflow
      document.documentElement.style.overscrollBehavior = originalOverscroll
      document.body.style.overflow = originalBodyOverflow
      document.body.style.overscrollBehavior = originalBodyOverscroll
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '')
    if (rawValue === '') {
      setAmount('')
    } else {
      const numValue = parseInt(rawValue, 10)
      setAmount(numValue.toLocaleString('ko-KR'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const numericAmount = parseInt(amount.replace(/,/g, ''), 10)

    if (!expenseDate || isNaN(numericAmount) || numericAmount <= 0 || !description || !bankName || !accountNumber.trim() || !accountHolder.trim() || !file) {
      return setErrorMsg('모든 항목을 올바르게 입력하고 영수증 사진을 첨부해 주세요.')
    }
    
    setIsSubmitting(true)
    setErrorMsg('')
    
    try {
      const fileExt = file.name.split('.').pop()
      const randomId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
      const fileName = `${userId}_${randomId}.${fileExt}`
      const filePath = `receipts/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      const combinedBankAccount = `${bankName} ${accountNumber.trim()} ${accountHolder.trim()}`

      const { error: dbError } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          category,
          expense_date: expenseDate,
          amount: numericAmount,
          description,
          bank_account: combinedBankAccount,
          receipt_image_url: publicUrl,
          status: 'PENDING'
        })

      if (dbError) throw dbError

      alert('비용 청구가 성공적으로 접수되었습니다.')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setErrorMsg('청구 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h3 className="text-xl font-bold text-gray-900">비용 청구하기</h3>
        <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">카테고리</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 focus:outline-none focus:border-gray-400">
              <option value="정기런">정기런</option>
              <option value="이벤트런">이벤트런</option>
              <option value="대회지원">대회지원</option>
              <option value="비품/기타">비품/기타</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">결제일</label>
            <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 focus:outline-none focus:border-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">상세 내역</label>
          <input type="text" placeholder="예: 수요정기런 음료수 및 간식" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 focus:outline-none focus:border-gray-400" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">청구 금액 (원)</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-lg font-bold text-gray-900 h-12 focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="space-y-2.5">
          <label className="block text-xs text-gray-500">입금 받을 계좌 정보</label>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 outline-none focus:border-gray-400"
              >
                {KOREAN_BANKS.map(bank => (
                  <option
                    key={bank}
                    value={bank === '선택해 주세요' ? '' : bank}
                    className="bg-white text-gray-900"
                  >
                    {bank}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder="예금주명"
                value={accountHolder}
                onChange={e => setAccountHolder(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="계좌번호 (- 포함)"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">영수증 사진 (필수)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300" />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 bg-[#CCFF00] text-gray-900 font-extrabold text-sm rounded-xl hover:bg-[#b8e600] transition-all disabled:opacity-50">
          {isSubmitting ? '영수증 업로드 중...' : '지출 청구 완료하기'}
        </button>
      </form>
    </div>
  )
}
