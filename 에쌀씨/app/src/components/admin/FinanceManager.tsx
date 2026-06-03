'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateSurvival } from '@/utils/survival'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type DuesRow = Database['public']['Tables']['dues']['Row']
type ExpenseRow = Database['public']['Tables']['expenses']['Row']
type FinanceSummary = Database['public']['Tables']['finance_summaries']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface FinanceManagerProps {
  initialProfiles: Profile[]
}

export default function FinanceManager({ initialProfiles }: FinanceManagerProps) {
  const supabase = createClient()
  const [profiles] = useState<Profile[]>(initialProfiles.filter(p => p.role !== 'WAITING' && p.is_active))
  
  const [duesList, setDuesList] = useState<DuesRow[]>([])
  const [expensesList, setExpensesList] = useState<ExpenseRow[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [records, setRecords] = useState<RunningRecord[]>([])
  
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'DUES' | 'EXPENSES'>('SUMMARY')
  const [isLoading, setIsLoading] = useState(true)
  
  // Previous Balance Edit State
  const [isEditingPrevBalance, setIsEditingPrevBalance] = useState(false)
  const [tempPrevBalance, setTempPrevBalance] = useState('')

  const currentDate = new Date()
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [dRes, eRes, sRes, rRes] = await Promise.all([
        supabase.from('dues').select('*').eq('target_month', currentMonthStr),
        supabase.from('expenses').select(`*, profiles(nickname)`).gte('expense_date', `${currentMonthStr}-01`).lte('expense_date', `${currentMonthStr}-31`),
        supabase.from('finance_summaries').select('*').eq('target_month', currentMonthStr).maybeSingle(),
        supabase.from('running_records').select('*').gte('run_date', `${currentMonthStr}-01`).lte('run_date', `${currentMonthStr}-31`)
      ])
      
      if (dRes.data) setDuesList(dRes.data)
      if (eRes.data) setExpensesList(eRes.data as any)
      if (sRes.data) setSummary(sRes.data)
      if (rRes.data) setRecords(rRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // 통계 계산
  const totalIncome = duesList.filter(d => d.status === 'PAID').reduce((sum, d) => sum + d.amount, 0)
  const totalExpense = expensesList.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0)
  const prevBalance = summary?.previous_balance || 0
  const currentBalance = prevBalance + totalIncome - totalExpense

  const handleUpdatePrevBalance = async () => {
    const val = parseInt(tempPrevBalance, 10)
    if (isNaN(val)) return alert('올바른 숫자를 입력하세요.')
    
    setIsLoading(true)
    if (summary) {
      const { data } = await supabase.from('finance_summaries').update({ previous_balance: val }).eq('id', summary.id).select().single()
      if (data) setSummary(data)
    } else {
      const { data } = await supabase.from('finance_summaries').insert({ target_month: currentMonthStr, previous_balance: val }).select().single()
      if (data) setSummary(data)
    }
    setIsEditingPrevBalance(false)
    setIsLoading(false)
  }

  const updateDuesStatus = async (id: string | null, userId: string, newStatus: string) => {
    if (id) {
      await supabase.from('dues').update({ status: newStatus }).eq('id', id)
    } else {
      await supabase.from('dues').insert({ user_id: userId, target_month: currentMonthStr, status: newStatus, amount: 10000 })
    }
    fetchData()
  }

  const updateExpenseStatus = async (id: string, newStatus: string) => {
    await supabase.from('expenses').update({ status: newStatus }).eq('id', id)
    fetchData()
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 서브 탭 네비게이션 */}
      <div className="flex gap-2 border-b border-white/5 pb-4">
        {[
          { id: 'SUMMARY', label: '📊 재무 요약표' },
          { id: 'DUES', label: '📥 회비 관리' },
          { id: 'EXPENSES', label: '💸 지출 정산' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center text-emerald-500">로딩 중...</div>}

      {/* 탭 1: 재무 요약표 (엑셀 형태) */}
      {!isLoading && activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl overflow-hidden">
            <h2 className="text-black font-black text-xl mb-4 text-center border-b pb-4">SRC {currentMonthStr} 재무 현황표</h2>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* 지출 리스트 (엑셀 왼쪽) */}
              <div className="flex-1 w-full border border-green-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-black">
                  <thead className="bg-green-800 text-white font-bold">
                    <tr>
                      <th className="py-2 px-2 text-left">구분</th>
                      <th className="py-2 px-2 text-left">일자/내용</th>
                      <th className="py-2 px-2 text-right">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesList.filter(e => e.status === 'APPROVED').map((e, i) => (
                      <tr key={e.id} className={i % 2 === 0 ? 'bg-green-50' : 'bg-white'}>
                        <td className="py-2 px-2 border-r border-green-200">
                          <span className="bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-bold">{e.category}</span>
                        </td>
                        <td className="py-2 px-2 border-r border-green-200">{e.expense_date.replace(/-/g, '')} {e.description}</td>
                        <td className="py-2 px-2 text-right text-red-600 font-bold">-{e.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {expensesList.filter(e => e.status === 'APPROVED').length === 0 && (
                      <tr><td colSpan={3} className="py-4 text-center text-gray-400">지출 내역이 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 요약 (엑셀 오른쪽) */}
              <div className="w-full md:w-64 space-y-4">
                <table className="w-full text-xs text-black border border-gray-300">
                  <tbody>
                    <tr>
                      <td className="p-2 border-b border-gray-300 bg-gray-100 font-bold text-center">지출 계</td>
                      <td className="p-2 border-b border-gray-300 text-right text-red-600 font-bold">-{totalExpense.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-gray-100 font-bold text-center">수입 계</td>
                      <td className="p-2 text-right text-blue-600 font-bold">+{totalIncome.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="w-full text-xs text-black border border-gray-300">
                  <tbody>
                    <tr>
                      <td className="p-2 border-b border-gray-300 bg-gray-100 font-bold text-center whitespace-nowrap">
                        전월 잔고
                        <button onClick={() => {setTempPrevBalance(prevBalance.toString()); setIsEditingPrevBalance(true)}} className="ml-1 text-[9px] text-gray-500 underline border px-1 rounded hover:bg-gray-200">수정</button>
                      </td>
                      <td className="p-2 border-b border-gray-300 text-right font-bold">
                        {isEditingPrevBalance ? (
                          <div className="flex gap-1 justify-end">
                            <input type="number" value={tempPrevBalance} onChange={e => setTempPrevBalance(e.target.value)} className="w-16 border rounded px-1" />
                            <button onClick={handleUpdatePrevBalance} className="bg-blue-500 text-white px-1 rounded">V</button>
                          </div>
                        ) : (
                          `₩${prevBalance.toLocaleString()}`
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-gray-100 font-bold text-center whitespace-nowrap">현재 잔고</td>
                      <td className="p-2 text-right font-black text-sm">₩{currentBalance.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 2: 회비 관리 */}
      {!isLoading && activeTab === 'DUES' && (
        <div className="rounded-2xl border border-white/5 bg-gray-900/40 p-6 overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/5 text-gray-500">
                <th className="pb-2">크루원</th>
                <th className="pb-2">생존상태</th>
                <th className="pb-2">회비상태</th>
                <th className="pb-2 text-right">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profiles.map(p => {
                const dues = duesList.find(d => d.user_id === p.id)
                const s = calculateSurvival(records.filter(r => r.user_id === p.id), p.is_exempted)
                const needsRefund = dues?.status === 'PAID' && !s.isSurvived && !p.is_exempted
                return (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="py-3 font-bold">{p.nickname} {needsRefund && <span className="bg-red-500/20 text-red-400 px-1 rounded text-[10px]">환불요망</span>}</td>
                    <td className={`py-3 ${s.isSurvived || p.is_exempted ? 'text-emerald-400' : 'text-gray-500'}`}>{s.statusText}</td>
                    <td className="py-3">
                      {!dues || dues.status === 'UNPAID' ? <span className="text-gray-500">미납</span> : 
                       dues.status === 'PENDING' ? <span className="text-blue-400 font-bold">확인 요청⏳</span> : 
                       dues.status === 'PAID' ? <span className="text-emerald-400 font-bold">입금 완료✅</span> : 
                       <span className="text-purple-400">환불됨</span>}
                    </td>
                    <td className="py-3 text-right space-x-1">
                      {dues?.status === 'PENDING' && <button onClick={() => updateDuesStatus(dues.id, p.id, 'PAID')} className="bg-blue-500 px-2 py-1 rounded text-white font-bold">승인</button>}
                      {(needsRefund || dues?.status === 'PAID') && <button onClick={() => updateDuesStatus(dues.id, p.id, 'REFUNDED')} className="bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold border border-red-500/30">환불</button>}
                      {(!dues || dues.status === 'UNPAID') && <button onClick={() => updateDuesStatus(dues?.id || null, p.id, 'PAID')} className="border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded font-bold">강제승인</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 탭 3: 지출 청구 내역 */}
      {!isLoading && activeTab === 'EXPENSES' && (
        <div className="space-y-4">
          {expensesList.length === 0 ? (
            <div className="text-center py-10 text-gray-500">청구된 지출 내역이 없습니다.</div>
          ) : (
            expensesList.map((e: any) => (
              <div key={e.id} className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
                {e.receipt_image_url && (
                  <div className="w-full md:w-32 aspect-square rounded-xl overflow-hidden bg-black/50 shrink-0">
                    <img src={e.receipt_image_url} alt="영수증" className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer" onClick={() => window.open(e.receipt_image_url, '_blank')} />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold bg-white/10 text-gray-300 px-2 py-0.5 rounded">{e.category}</span>
                      <h4 className="text-lg font-bold text-white mt-1">{e.description}</h4>
                      <p className="text-xs text-gray-500">{e.expense_date} · 신청자: {e.profiles?.nickname}</p>
                    </div>
                    <div className="text-xl font-black text-red-400">-{e.amount.toLocaleString()}원</div>
                  </div>
                  
                  <div className="bg-black/40 rounded-lg p-2 text-xs flex justify-between items-center border border-white/5">
                    <span className="text-gray-400">송금 계좌</span>
                    <span className="font-mono text-white select-all">{e.bank_account}</span>
                  </div>
                </div>
                
                <div className="flex md:flex-col justify-end gap-2 md:w-24 shrink-0">
                  {e.status === 'PENDING' ? (
                    <>
                      <button onClick={() => updateExpenseStatus(e.id, 'APPROVED')} className="flex-1 py-2 bg-emerald-500 text-black font-bold rounded-xl text-sm">승인(송금완료)</button>
                      <button onClick={() => updateExpenseStatus(e.id, 'REJECTED')} className="flex-1 py-2 bg-red-500/20 text-red-400 font-bold rounded-xl text-sm">반려</button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <span className={`font-bold text-sm ${e.status === 'APPROVED' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {e.status === 'APPROVED' ? '✅ 정산 완료' : '❌ 반려됨'}
                      </span>
                      <button onClick={() => deleteExpense(e.id)} className="mt-2 text-xs text-gray-600 hover:text-gray-400 underline">내역 삭제</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
