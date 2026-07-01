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

// 은행 계좌번호 프리셋 (가장 자주 청구하는 운영진/페이서 명단)
const ACCOUNT_PRESETS = [
  { id: 'jieun', label: '김지은 신한 110388937930', name: '김지은', bank: '신한은행', account: '110388937930' },
  { id: 'jin', label: '허진 신한 110311755156', name: '허진', bank: '신한은행', account: '110311755156' },
  { id: 'byungjin', label: '박병진 국민 30700204099981', name: '박병진', bank: 'KB국민은행', account: '30700204099981' },
  { id: 'byungkwan', label: '고병관 농협 3020101632781', name: '고병관', bank: 'NH농협', account: '3020101632781' },
  { id: 'hyeyoo', label: '정혜유 SC제일은행 63220154745', name: '정혜유', bank: 'SC제일은행', account: '63220154745' },
  { id: 'bomin', label: '김보민 신한 110411567809', name: '김보민', bank: '신한은행', account: '110411567809' },
]

export default function ExpenseClaimForm({ userId, onClose, onSuccess }: ExpenseClaimFormProps) {
  const supabase = createClient() as any
  
  const [claimantName, setClaimantName] = useState('')
  const [claimantPhone, setClaimantPhone] = useState('')
  const [category, setCategory] = useState('정기런')
  const [expenseDate, setExpenseDate] = useState(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  
  // 계좌 정보
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // 접속한 유저의 프로필 정보 자동 완성
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname, phone')
          .eq('id', userId)
          .single()
        
        if (data) {
          setClaimantName(data.nickname || '')
          setClaimantPhone(data.phone || '')
          setAccountHolder(data.nickname || '')
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchUserProfile()
  }, [userId])

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

  // 프리셋 선택 시 계좌 필드 자동 채우기
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId)
    if (presetId === 'custom') {
      setBankName('')
      setAccountNumber('')
      setAccountHolder(claimantName)
    } else {
      const preset = ACCOUNT_PRESETS.find(p => p.id === presetId)
      if (preset) {
        setBankName(preset.bank)
        setAccountNumber(preset.account)
        setAccountHolder(preset.name)
      }
    }
  }

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

    if (!claimantName.trim() || !claimantPhone.trim()) {
      return setErrorMsg('청구자 성함과 연락처를 입력해 주세요.')
    }
    if (!expenseDate || isNaN(numericAmount) || numericAmount <= 0 || !description || !bankName || !accountNumber.trim() || !accountHolder.trim() || !file) {
      return setErrorMsg('모든 항목을 올바르게 입력하고 영수증 사진을 첨부해 주세요.')
    }
    
    setIsSubmitting(true)
    setErrorMsg('')
    
    try {
      const fileExt = file.name.split('.').pop()
      const randomId = Math.random().toString(36).substring(2, 15)
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
          status: 'PENDING',
          claimant_name: claimantName,
          claimant_phone: claimantPhone
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
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 relative overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 sticky top-0 bg-white z-10">
        <h3 className="text-lg font-bold text-gray-900">비용 청구하기</h3>
        <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 pb-2">
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-semibold text-red-600 animate-pulse">
            {errorMsg}
          </div>
        )}

        {/* 1. 성함 및 연락처 (자동완성 및 수정 가능) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">성함 *</label>
            <input required type="text" placeholder="홍길동" value={claimantName} onChange={e => setClaimantName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">연락처 *</label>
            <input required type="text" placeholder="010-1234-5678" value={claimantPhone} onChange={e => setClaimantPhone(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 focus:outline-none focus:border-gray-400" />
          </div>
        </div>

        {/* 2. 카테고리 및 지출일 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">지출 종류 *</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 focus:outline-none focus:border-gray-400">
              <option value="정기런">정기런</option>
              <option value="훈련벙">훈련벙</option>
              <option value="이벤트런">이벤트벙</option>
              <option value="비품/기타">기타/비품</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">지출 일자 *</label>
            <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 focus:outline-none focus:border-gray-400" />
          </div>
        </div>

        {/* 3. 상세내역 */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">지출 내용 *</label>
          <input type="text" placeholder="예: 수요정기런 음료수 및 간식" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 h-11 focus:outline-none focus:border-gray-400" />
        </div>

        {/* 4. 금액 */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">사용 금액 입력 *</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-base font-extrabold text-gray-900 h-11 focus:outline-none focus:border-gray-400"
          />
        </div>

        {/* 5. 계좌번호 빠른 프리셋 선택 (매우 편리) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500">청구 받으실 은행 및 계좌번호 *</label>
          <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50 space-y-2 text-xs">
            {ACCOUNT_PRESETS.map((preset) => (
              <label key={preset.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                <input
                  type="radio"
                  name="account_preset"
                  checked={selectedPresetId === preset.id}
                  onChange={() => handlePresetChange(preset.id)}
                  className="accent-gray-900 h-3.5 w-3.5"
                />
                <span className={`font-medium ${selectedPresetId === preset.id ? 'text-gray-900 font-bold' : 'text-gray-650'}`}>
                  {preset.label}
                </span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer py-0.5 border-t border-gray-200 pt-2">
              <input
                type="radio"
                name="account_preset"
                checked={selectedPresetId === 'custom'}
                onChange={() => handlePresetChange('custom')}
                className="accent-gray-900 h-3.5 w-3.5"
              />
              <span className={`font-medium ${selectedPresetId === 'custom' ? 'text-gray-900 font-bold' : 'text-gray-650'}`}>
                직접 입력 (기타)
              </span>
            </label>
          </div>
        </div>

        {/* 6. 계좌 상세정보 입력란 */}
        <div className="space-y-2 pl-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-450 mb-0.5">은행명</label>
              <select
                disabled={selectedPresetId !== 'custom'}
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full bg-gray-50 disabled:opacity-75 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 h-10 outline-none focus:border-gray-400"
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
              <label className="block text-[10px] text-gray-450 mb-0.5">예금주명</label>
              <input
                disabled={selectedPresetId !== 'custom'}
                type="text"
                placeholder="예금주"
                value={accountHolder}
                onChange={e => setAccountHolder(e.target.value)}
                className="w-full bg-gray-50 disabled:opacity-75 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 h-10 outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-450 mb-0.5">계좌번호 (- 없이 숫자만)</label>
            <input
              disabled={selectedPresetId !== 'custom'}
              type="text"
              placeholder="계좌번호 입력"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              className="w-full bg-gray-50 disabled:opacity-75 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 h-10 outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* 7. 영수증 업로드 */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">지출내용 및 영수증 업로드 *</label>
          <input required type="file" accept="image/*" onChange={handleFileChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-gray-250 file:text-gray-700 hover:file:bg-gray-300" />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 bg-[#CCFF00] border border-[#b8e600] text-gray-900 font-extrabold text-sm rounded-2xl hover:bg-[#b8e600] transition-all disabled:opacity-50 active:scale-[0.98]">
          {isSubmitting ? '영수증 업로드 중...' : '지출 청구 완료하기'}
        </button>
      </form>
    </div>
  )
}
