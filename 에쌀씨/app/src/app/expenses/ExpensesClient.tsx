'use client'

import React, { useState, useEffect, useMemo } from 'react'
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

// 과거 특정 월의 상세 지출 내역을 지연 로딩(Lazy-fetch)하여 보여주는 컴포넌트
function PastMonthAccordion({ 
  monthStr, 
  userNickname, 
  supabase, 
  onShowReceipt 
}: { 
  monthStr: string
  userNickname: string
  supabase: any
  onShowReceipt: (url: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [duesSum, setDuesSum] = useState(0)

  // 사용자가 아코디언을 열었을 때에만 데이터를 Supabase에서 가져옵니다 (Lazy-loading)
  useEffect(() => {
    if (!isOpen) return

    const fetchPastMonthData = async () => {
      setIsLoading(true)
      try {
        const [year, month] = monthStr.split('-').map(Number)
        const lastDay = new Date(year, month, 0).getDate()
        const endOfMonthStr = `${monthStr}-${String(lastDay).padStart(2, '0')}`

        const [sumRes, expRes, duesRes] = await Promise.all([
          supabase
            .from('finance_summaries')
            .select('*')
            .eq('target_month', monthStr)
            .maybeSingle(),
          supabase
            .from('expenses')
            .select(`*, profiles(nickname)`)
            .eq('status', 'APPROVED')
            .gte('expense_date', `${monthStr}-01`)
            .lte('expense_date', endOfMonthStr)
            .order('expense_date', { ascending: false }),
          supabase
            .from('dues')
            .select('amount')
            .eq('target_month', monthStr)
            .eq('status', 'PAID')
        ])

        setSummary(sumRes.data || null)
        setExpenses(expRes.data || [])
        
        const totalDues = (duesRes.data || []).reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
        setDuesSum(totalDues)
      } catch (err) {
        console.error('과거 지출 가져오기 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPastMonthData()
  }, [isOpen, monthStr])

  const [year, month] = monthStr.split('-')
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const canViewBalance = userNickname.includes('박병진') || summary?.is_balance_visible === true
  const prevBalance = summary?.previous_balance || 0
  const currentBalance = prevBalance + duesSum - totalExpenseAmount

  return (
    <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden transition-all duration-300">
      {/* 아코디언 헤더 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📁</span>
          <div>
            <span className="font-bold text-gray-900 text-sm">{year}년 {parseInt(month, 10)}월 사용 내역</span>
            <p className="text-[10px] text-gray-400 mt-0.5">정산 완료 아카이브</p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-gray-900' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 아코디언 바디 (지연 로딩) */}
      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 gap-2">
              <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs text-gray-500 font-medium">데이터 불러오는 중...</span>
            </div>
          ) : (
            <>
              {/* 과거 지출 요약표 */}
              <div className="bg-gray-900 rounded-2xl p-4 text-white border border-gray-800 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">총 회비 지출액</span>
                  <span className="font-bold text-[#CCFF00]">₩{totalExpenseAmount.toLocaleString()}</span>
                </div>
                {canViewBalance ? (
                  <div className="pt-2 border-t border-gray-800 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-400">
                    <div>
                      <p>전월 이월</p>
                      <p className="text-white font-bold mt-0.5">₩{prevBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-blue-400">당월 수입</p>
                      <p className="text-blue-400 font-bold mt-0.5">₩{duesSum.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[#CCFF00]">현재 잔고</p>
                      <p className="text-[#CCFF00] font-bold mt-0.5">₩{currentBalance.toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-800 text-[10px] text-gray-500 flex justify-between items-center">
                    <span>잔고 공개 여부</span>
                    <span className="font-bold text-gray-450">비공개 🔒</span>
                  </div>
                )}
              </div>

              {/* 과거 지출 리스트 */}
              {expenses.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400">지출 승인 내역이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="bg-white rounded-xl border border-gray-200 p-3.5 space-y-2">
                      <div className="flex justify-between items-start text-xs">
                        <div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-650">{expense.category}</span>
                          <h5 className="font-bold text-gray-900 mt-1">{expense.description}</h5>
                          <p className="text-[9px] text-gray-400 mt-0.5">{expense.expense_date} · {expense.claimant_name || expense.profiles?.nickname || '탈퇴회원'}</p>
                        </div>
                        <span className="font-bold text-red-600">-{expense.amount.toLocaleString()}원</span>
                      </div>
                      {expense.receipt_image_url && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => onShowReceipt(expense.receipt_image_url!)}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-[9px] px-2.5 py-1 rounded-lg transition-colors border border-gray-200"
                          >
                            📄 영수증 보기
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function ExpensesClient({ userId, userNickname }: ExpensesClientProps) {
  const supabase = createClient() as any

  // 이번 달 (기본 설정)
  const today = new Date()
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [isLoading, setIsLoading] = useState(true)
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [duesSum, setDuesSum] = useState(0)
  
  // 영수증 모달 제어
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null)

  // 지출 명세 페이지네이션 상태
  const [expensePage, setExpensePage] = useState(1)

  // 월별 납부 현황 연동용 상태
  const [allDues, setAllDues] = useState<any[]>([])
  const [activeProfiles, setActiveProfiles] = useState<any[]>([])
  const [duesSearch, setDuesSearch] = useState('')

  const fetchCurrentMonthData = async () => {
    setIsLoading(true)
    try {
      const [year, month] = currentMonthStr.split('-').map(Number)
      const lastDay = new Date(year, month, 0).getDate()
      const endOfMonthStr = `${currentMonthStr}-${String(lastDay).padStart(2, '0')}`

      const [sumRes, expRes, duesRes] = await Promise.all([
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
          .lte('expense_date', endOfMonthStr)
          .order('expense_date', { ascending: false }),
        supabase
          .from('dues')
          .select('amount')
          .eq('target_month', currentMonthStr)
          .eq('status', 'PAID')
      ])

      setSummary(sumRes.data || null)
      setExpenses(expRes.data || [])
      
      const totalDues = (duesRes.data || []).reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
      setDuesSum(totalDues)

      // 회비 현황이 활성화되었거나 관리자(박병진) 계정인 경우 전체 납부 현황도 같이 로드
      const isDuesVisible = sumRes.data?.is_dues_visible === true || userNickname.includes('박병진')
      if (isDuesVisible) {
        const [duesListRes, profilesRes] = await Promise.all([
          supabase
            .from('dues')
            .select('*')
            .eq('target_month', currentMonthStr),
          supabase
            .from('profiles')
            .select('id, nickname, role, is_active')
            .eq('is_active', true)
        ])
        setAllDues(duesListRes.data || [])
        setActiveProfiles(profilesRes.data || [])
      }

    } catch (err) {
      console.error('지출 데이터 가져오기 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentMonthData()
  }, [])

  const isVisible = summary?.is_expenses_visible === true
  const isDuesVisible = summary?.is_dues_visible === true || userNickname.includes('박병진')
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const canViewBalance = userNickname.includes('박병진') || summary?.is_balance_visible === true
  const prevBalance = summary?.previous_balance || 0
  const currentBalance = prevBalance + duesSum - totalExpenseAmount

  // 지출명세 10건 페이지네이션 계산
  const EXPENSES_PER_PAGE = 10
  const totalPages = Math.ceil(expenses.length / EXPENSES_PER_PAGE)
  const paginatedExpenses = expenses.slice((expensePage - 1) * EXPENSES_PER_PAGE, expensePage * EXPENSES_PER_PAGE)

  // 납부 현황 정렬 및 검색 필터링
  const filteredDuesProfiles = useMemo(() => {
    return activeProfiles
      .filter(p => p.nickname.toLowerCase().includes(duesSearch.toLowerCase()))
      .sort((a, b) => {
        const aExempt = a.role === 'ADMIN' || a.role === 'PACER'
        const bExempt = b.role === 'ADMIN' || b.role === 'PACER'
        if (aExempt && !bExempt) return -1
        if (!aExempt && bExempt) return 1
        return a.nickname.localeCompare(b.nickname, 'ko')
      })
  }, [activeProfiles, duesSearch])

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-gray-900">
      {/* 헤더 */}
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
          <h1 className="text-base font-bold text-gray-900">회비 사용 내역</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-6 pt-5">
        {/* 상단 탭 장식: 이번 달 현황 */}
        <div className="border-b border-gray-100 pb-2 flex justify-between items-baseline">
          <h2 className="text-lg font-black text-gray-900">이번 달 회비 사용 현황</h2>
          <span className="text-xs text-gray-450 font-bold">{today.getFullYear()}년 {today.getMonth() + 1}월 실시간</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-gray-500 font-bold">지출 내역 로딩 중...</span>
          </div>
        ) : (
          <>
            {/* 이번 달 비공개인 경우 */}
            {!isVisible ? (
              <div className="flex flex-col items-center justify-center border border-gray-200 rounded-3xl bg-gray-50 p-8 text-center space-y-3 shadow-sm animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xl shadow-inner">
                  🔒
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">이번 달 지출 내역 정산 중</h3>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    이번 달 지출 내역은 아직 비공개 상태입니다.<br />
                    운영진 정산 및 공개 설정 완료 후 노출됩니다.
                  </p>
                </div>
              </div>
            ) : (
              /* 이번 달 공개된 지출 리스트 */
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* 이번 달 요약 카드 */}
                <div className="bg-gray-900 rounded-3xl p-6 text-white border border-gray-800 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">총 회비 지출액</p>
                      <h3 className="text-2xl font-black text-[#CCFF00] mt-1">₩{totalExpenseAmount.toLocaleString()}</h3>
                    </div>
                    <div className="text-3xl">💸</div>
                  </div>

                  {canViewBalance ? (
                    <div className="pt-4 border-t border-gray-800 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-400">
                      <div>
                        <p className="font-semibold text-gray-400">전월 이월</p>
                        <p className="text-xs font-bold text-white mt-1">₩{prevBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-400">당월 수입 (+)</p>
                        <p className="text-xs font-bold text-blue-400 mt-1">₩{duesSum.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#CCFF00]">현재 잔고</p>
                        <p className="text-xs font-bold text-[#CCFF00] mt-1">₩{currentBalance.toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-gray-800 text-[10px] text-gray-500 flex justify-between items-center">
                      <span>잔고 공개 여부</span>
                      <span className="font-bold flex items-center gap-1 text-gray-450">비공개 🔒</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-gray-500 tracking-wider">
                    승인된 지출 명세 ({expenses.length}건)
                  </h3>
                </div>

                {expenses.length === 0 ? (
                  <div className="rounded-3xl border border-gray-200 bg-gray-50 py-12 text-center text-xs text-gray-500">
                    아직 이번 달 승인 완료된 지출 건이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="bg-white rounded-xl border border-gray-200 py-2.5 px-4 flex items-center justify-between hover:bg-gray-50 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 whitespace-nowrap">
                            {expense.category}
                          </span>
                          <div className="space-y-0.5">
                            <h4 className="font-extrabold text-gray-900 leading-tight">
                              {expense.description}
                            </h4>
                            <div className="flex items-center gap-2 text-[9px] text-gray-400">
                              <span>{expense.expense_date}</span>
                              <span>·</span>
                              <span>청구인: {expense.claimant_name || expense.profiles?.nickname || '탈퇴한 러너'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-black text-red-650 text-xs whitespace-nowrap">
                            -{expense.amount.toLocaleString()}원
                          </span>
                          {expense.receipt_image_url && (
                            <button
                              onClick={() => setActiveReceiptUrl(expense.receipt_image_url)}
                              className="bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 font-bold px-2 py-1 rounded-lg transition-colors border border-gray-200 active:scale-95 text-[9px] whitespace-nowrap"
                            >
                              📄 영수증
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* 페이지네이션 컨트롤 */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center pt-2">
                        <button
                          onClick={() => setExpensePage(prev => Math.max(1, prev - 1))}
                          disabled={expensePage === 1}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          이전
                        </button>
                        <span className="text-xs text-gray-500 font-bold">
                          {expensePage} / {totalPages} 페이지
                        </span>
                        <button
                          onClick={() => setExpensePage(prev => Math.min(totalPages, prev + 1))}
                          disabled={expensePage === totalPages}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 탭: 이번 달 회비 납부 현황 */}
        <div className="pt-6 space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <h2 className="text-base font-black text-gray-900">이번 달 회비 납부 현황</h2>
          </div>

          {!isDuesVisible ? (
            <div className="flex flex-col items-center justify-center border border-gray-200 rounded-3xl bg-gray-50 p-8 text-center space-y-3 shadow-sm animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xl shadow-inner">
                🔒
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-950">회비 납부 현황 정산 중</h3>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  이번 달 회비 납부 현황은 비공개 상태입니다.<br />
                  운영진 수납 확인 완료 후 월초에 공개됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-4 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 tracking-wider">회비 납부 명단 ({activeProfiles.length}명)</h3>
                <div className="relative max-w-[140px] w-full">
                  <input
                    type="text"
                    placeholder="이름 검색..."
                    value={duesSearch}
                    onChange={e => setDuesSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-950 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                  />
                  <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-50">
                {filteredDuesProfiles.map(p => {
                  const dues = allDues.find(d => d.user_id === p.id)
                  const isExempted = p.role === 'ADMIN' || p.role === 'PACER'
                  return (
                    <div key={p.id} className="flex justify-between items-center py-2 text-xs first:pt-0 last:pb-0">
                      <span className="font-bold text-gray-900">{p.nickname}</span>
                      <div>
                        {isExempted ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                            면제 ({p.role === 'ADMIN' ? '운영진' : '페이서'})
                          </span>
                        ) : dues?.status === 'PAID' ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">✓ 납부완료</span>
                        ) : dues?.status === 'PENDING' ? (
                          <span className="text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full text-[10px]">승인대기</span>
                        ) : (
                          <span className="text-red-500 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full text-[10px]">미납</span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {filteredDuesProfiles.length === 0 && (
                  <p className="text-center py-6 text-xs text-gray-400">일치하는 회원이 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 영수증 보기 팝업 모달 */}
      {activeReceiptUrl && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in duration-200"
          onClick={() => setActiveReceiptUrl(null)}
        >
          <div className="relative max-w-full max-h-[85vh] overflow-auto rounded-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <img
              src={activeReceiptUrl}
              alt="Receipt"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
          
          <button
            onClick={() => setActiveReceiptUrl(null)}
            className="mt-6 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs px-5 py-3 rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            닫기
          </button>
        </div>
      )}
    </div>
  )
}
