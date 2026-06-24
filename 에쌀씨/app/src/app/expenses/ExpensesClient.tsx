'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type ExpenseRow = Database['public']['Tables']['expenses']['Row'] & {
  profiles?: {
    nickname: string
  } | null
}
type FinanceSummary = Database['public']['Tables']['finance_summaries']['Row']

interface ExpensesClientProps {
  userId: string
  userNickname: string
}

export default function ExpensesClient({ userId, userNickname }: ExpensesClientProps) {
  const router = useRouter()
  const supabase = createClient() as any

  // Selected date
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const [isLoading, setIsLoading] = useState(true)
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  
  // Receipt Modal State
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null)

  const currentMonthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`

  const fetchExpensesData = async () => {
    setIsLoading(true)
    try {
      const [sumRes, expRes] = await Promise.all([
        supabase
          .from('finance_summaries')
          .select('*')
          .eq('target_month', currentMonthStr)
          .maybeSingle(),
        supabase
          .from('expenses')
          .select(`*, profiles(nickname)`)
          .eq('status', 'APPROVED')
          .gte('expense_date', `${currentMonthStr}-01`)
          .lte('expense_date', `${currentMonthStr}-31`)
          .order('expense_date', { ascending: false })
      ])

      setSummary(sumRes.data || null)
      setExpenses(expRes.data || [])
    } catch (err) {
      console.error('지출 내역 가져오기 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExpensesData()
  }, [selectedDate])

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const isVisible = summary?.is_expenses_visible === true
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all active:scale-95 group"
          >
            <svg className="h-5 w-5 transition-transform group-active:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-semibold">대시보드</span>
          </Link>
          <h1 className="text-base font-bold text-gray-900">회비 지출 내역</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-6 pt-5">
        {/* Month Selector */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors active:scale-95 border border-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-lg font-extrabold text-gray-950">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors active:scale-95 border border-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-gray-500 font-bold">지출 내역 로딩 중...</span>
          </div>
        ) : !isVisible ? (
          /* 비공개 상태 안내 */
          <div className="flex flex-col items-center justify-center border border-gray-200 rounded-3xl bg-gray-50 p-12 text-center space-y-4 shadow-sm animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-2xl shadow-inner">
              🔒
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">지출 내역 비공개</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                해당 월의 지출 내역은 아직 비공개 상태입니다.<br />
                운영진 정산 완료 후 공개 전환될 예정입니다.
              </p>
            </div>
          </div>
        ) : (
          /* 공개 상태 내역 리스트 */
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* 총액 요약 카드 */}
            <div className="bg-gray-900 rounded-3xl p-6 text-white border border-gray-800 shadow-md flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">총 회비 지출액</p>
                <h3 className="text-2xl font-black text-[#CCFF00] mt-1.5">₩{totalExpenseAmount.toLocaleString()}</h3>
              </div>
              <div className="text-3xl">💸</div>
            </div>

            <div className="flex items-center justify-between px-1 pt-2">
              <h3 className="text-xs font-bold text-gray-500 tracking-wider">
                승인된 지출 건수 ({expenses.length}건)
              </h3>
            </div>

            {expenses.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-gray-50 py-16 text-center text-xs text-gray-500">
                해당 월의 승인 완료된 지출 내역이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 hover:shadow-sm hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-150 text-gray-700">
                            {expense.category}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {expense.expense_date}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-gray-900 tracking-tight">
                          {expense.description}
                        </h4>
                      </div>
                      <span className="text-sm font-black text-red-600">
                        -{expense.amount.toLocaleString()}원
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-[10px]">
                      <div className="flex items-center gap-1 text-gray-500">
                        <span>청구인:</span>
                        <span className="font-bold text-gray-900">
                          {expense.profiles?.nickname || '탈퇴한 러너'}
                        </span>
                      </div>

                      {expense.receipt_image_url && (
                        <button
                          onClick={() => setActiveReceiptUrl(expense.receipt_image_url)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-bold px-3 py-1.5 rounded-xl transition-colors active:scale-95 flex items-center gap-1"
                        >
                          📄 영수증 보기
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Receipt Image Lightbox Modal */}
      {activeReceiptUrl && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in duration-250"
          onClick={() => setActiveReceiptUrl(null)}
        >
          <div className="relative max-w-full max-h-[85vh] overflow-auto rounded-2xl" onClick={e => e.stopPropagation()}>
            <img
              src={activeReceiptUrl}
              alt="Receipt"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-xl"
            />
          </div>
          
          <button
            onClick={() => setActiveReceiptUrl(null)}
            className="mt-6 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs px-5 py-3 rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            닫기
          </button>
        </div>
      )}
    </div>
  )
}
