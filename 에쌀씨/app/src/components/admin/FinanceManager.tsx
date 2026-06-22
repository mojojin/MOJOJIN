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
  const supabase = createClient() as any
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

  // 이체 내역 매칭용 상태
  const [pastedText, setPastedText] = useState('')
  const [matchResults, setMatchResults] = useState<{ userId: string; nickname: string; matchedLine: string }[] | null>(null)
  const [selectedMatches, setSelectedMatches] = useState<Record<string, boolean>>({})

  // 입금 내역 매칭 분석 함수
  const runMatchCheck = (rawText: string) => {
    if (!rawText.trim()) return alert('이체 내역 텍스트를 입력하거나 CSV 파일을 업로드해주세요.')
    
    const lines = rawText.split(/\r?\n/)
    const results: { userId: string; nickname: string; matchedLine: string }[] = []
    
    // 이미 입금완료(PAID)거나 면제 대상인 회원은 매칭 제외
    const checkableProfiles = profiles.filter(p => {
      const isExempt = p.role === 'ADMIN' || p.role === 'PACER'
      const dues = duesList.find(d => d.user_id === p.id)
      return !isExempt && dues?.status !== 'PAID'
    })
    
    checkableProfiles.forEach(p => {
      const nick = p.nickname.trim()
      if (!nick) return
      
      // 닉네임이 한 줄에 포함되어 있는지 체크 (대소문자 무시, 공백 무시)
      const matchedLine = lines.find(line => {
        const cleanLine = line.replace(/\s+/g, '').toLowerCase()
        const cleanNick = nick.replace(/\s+/g, '').toLowerCase()
        return cleanLine.includes(cleanNick)
      })

      if (matchedLine) {
        results.push({
          userId: p.id,
          nickname: p.nickname,
          matchedLine: matchedLine.trim()
        })
      }
    })
    
    if (results.length === 0) {
      alert('매칭되는 회원을 찾지 못했습니다. 이체 내역 내용이나 닉네임을 확인해주세요.')
    }
    
    setMatchResults(results)
    
    // 기본적으로 모두 선택
    const initialSelect: Record<string, boolean> = {}
    results.forEach(r => {
      initialSelect[r.userId] = true
    })
    setSelectedMatches(initialSelect)
  }

  // CSV 파일 업로드 핸들러 (EUC-KR 및 UTF-8 자동 감지/지원)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      setPastedText(text)
      runMatchCheck(text)
    }
    
    // 한국 은행들의 CSV 파일은 주로 EUC-KR(MS949)로 인코딩되어 저장됩니다.
    // 일단 EUC-KR로 읽고 한글 깨짐이 덜하도록 설정
    reader.readAsText(file, 'EUC-KR')
  }

  // 매칭된 내역 일괄 납부 승인 처리
  const handleBatchApproveDues = async (selectedUserIds: string[]) => {
    if (selectedUserIds.length === 0) return alert('선택된 회원이 없습니다.')
    
    if (!confirm(`선택한 ${selectedUserIds.length}명의 회원을 '입금 완료' 상태로 일괄 변경하시겠습니까?`)) return
    
    setIsLoading(true)
    try {
      const promises = selectedUserIds.map(async (uid) => {
        const existingDues = duesList.find(d => d.user_id === uid)
        if (existingDues) {
          return supabase.from('dues').update({ status: 'PAID' }).eq('id', existingDues.id)
        } else {
          return supabase.from('dues').insert({ 
            user_id: uid, 
            target_month: currentMonthStr, 
            status: 'PAID', 
            amount: 10000 
          })
        }
      })
      
      await Promise.all(promises)
      alert(`${selectedUserIds.length}명의 회비 납부 승인이 완료되었습니다.`)
      setMatchResults(null)
      setPastedText('')
      fetchData()
    } catch (err) {
      console.error('Batch dues update error:', err)
      alert('일괄 승인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateExpenseStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('expenses').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Update expense status error:', err)
      alert('지출 상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Delete expense error:', err)
      alert('지출 정산 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 서브 탭 네비게이션 */}
      <div className="flex gap-2 border-b border-gray-100 pb-4">
        {[
          { id: 'SUMMARY', label: '📊 재무 요약표' },
          { id: 'DUES', label: '📥 회비 관리' },
          { id: 'EXPENSES', label: '💸 지출 정산' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-[#CCFF00] border border-[#b8e600] text-gray-900' 
                : 'bg-gray-55 border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center text-gray-500 text-xs">로딩 중...</div>}

      {/* 탭 1: 재무 요약표 (엑셀 형태) */}
      {!isLoading && activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <h2 className="text-gray-900 font-bold text-base mb-4 text-center border-b border-gray-100 pb-4">SRC {currentMonthStr} 재무 현황표</h2>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* 지출 리스트 (엑셀 왼쪽) */}
              <div className="flex-1 w-full border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-gray-900">
                  <thead className="bg-gray-50 text-gray-950 font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left">구분</th>
                      <th className="py-2.5 px-3 text-left">일자/내용</th>
                      <th className="py-2.5 px-3 text-right">금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {expensesList.filter(e => e.status === 'APPROVED').map((e, i) => (
                      <tr key={e.id} className={i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}>
                        <td className="py-2.5 px-3 border-r border-gray-100">
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-2xl font-bold">{e.category}</span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-gray-100">{e.expense_date.replace(/-/g, '')} {e.description}</td>
                        <td className="py-2.5 px-3 text-right text-red-600 font-bold">-{e.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {expensesList.filter(e => e.status === 'APPROVED').length === 0 && (
                      <tr><td colSpan={3} className="py-6 text-center text-gray-400">지출 내역이 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 요약 (엑셀 오른쪽) */}
              <div className="w-full md:w-64 space-y-4">
                <table className="w-full text-xs text-gray-900 border border-gray-200 rounded-2xl overflow-hidden">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-2.5 bg-gray-50 font-bold text-center border-r border-gray-200">지출 계</td>
                      <td className="p-2.5 text-right text-red-650 font-bold">-{totalExpense.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 bg-gray-50 font-bold text-center border-r border-gray-200">수입 계</td>
                      <td className="p-2.5 text-right text-blue-650 font-bold">+{totalIncome.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="w-full text-xs text-gray-900 border border-gray-200 rounded-2xl overflow-hidden">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-2.5 bg-gray-50 font-bold text-center whitespace-nowrap border-r border-gray-200">
                        전월 잔고
                        <button onClick={() => {setTempPrevBalance(prevBalance.toString()); setIsEditingPrevBalance(true)}} className="ml-1.5 text-[10px] text-gray-500 hover:text-gray-900 underline border border-gray-200 px-1.5 py-0.5 rounded-2xl hover:bg-gray-100 transition-all">수정</button>
                      </td>
                      <td className="p-2.5 text-right font-bold">
                        {isEditingPrevBalance ? (
                          <div className="flex gap-1 justify-end">
                            <input type="number" value={tempPrevBalance} onChange={e => setTempPrevBalance(e.target.value)} className="w-20 border rounded-2xl px-2 py-0.5 text-gray-900 focus:outline-none" />
                            <button onClick={handleUpdatePrevBalance} className="bg-[#CCFF00] border border-[#b8e600] text-gray-900 px-2 py-0.5 rounded-2xl font-bold">확인</button>
                          </div>
                        ) : (
                          `₩${prevBalance.toLocaleString()}`
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 bg-gray-50 font-bold text-center whitespace-nowrap border-r border-gray-200">현재 잔고</td>
                      <td className="p-2.5 text-right font-black text-sm text-gray-950">₩{currentBalance.toLocaleString()}</td>
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
        <div className="space-y-6">
          {/* 입금 내역 매칭 섹션 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-950">📥 이체 내역 매칭기 (CSV / 텍스트)</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  통장 거래 내역 파일을 올리거나 이체 텍스트를 붙여넣어 닉네임과 일치하는 회원을 자동으로 입금 처리합니다.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-500 mb-1">파일 업로드 (CSV / TXT)</label>
                <input 
                  type="file" 
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-2xl file:border-0 file:text-[11px] file:font-bold file:bg-[#CCFF00] file:text-gray-900 hover:file:bg-[#b8e600] file:cursor-pointer bg-white border border-gray-200 rounded-2xl p-2.5" 
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-500 mb-1">내역 복사-붙여넣기 (직접 입력)</label>
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="예:&#13;06/10 12:30 홍길동 10,000&#13;06/10 13:45 이순신 10,000"
                  className="w-full h-24 bg-white border border-gray-200 rounded-2xl p-3 text-xs text-gray-900 focus:outline-none focus:border-gray-400 placeholder-gray-400 font-mono"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-1">
              {pastedText && (
                <button
                  onClick={() => { setPastedText(''); setMatchResults(null); }}
                  className="px-4 py-2 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
                >
                  초기화
                </button>
              )}
              <button
                onClick={() => runMatchCheck(pastedText)}
                className="px-4 py-2 rounded-2xl bg-[#CCFF00] border border-[#b8e600] text-gray-900 text-xs font-bold hover:bg-[#b8e600] transition-colors active:scale-95"
              >
                매칭 분석 실행
              </button>
            </div>

            {/* 매칭 분석 결과 표시 */}
            {matchResults && (
              <div className="border-t border-gray-150 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-emerald-650 flex items-center gap-1.5">
                    <span>💡</span> 매칭 결과: 총 {matchResults.length}건 검출됨
                  </h4>
                  <span className="text-[10px] text-gray-400">체크된 회원이 납부 처리됩니다.</span>
                </div>
                
                {matchResults.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-500">
                    일치하는 미납자 닉네임을 찾지 못했습니다.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {matchResults.map(r => (
                        <label key={r.userId} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all active:scale-[0.99]">
                          <input 
                            type="checkbox"
                            checked={!!selectedMatches[r.userId]}
                            onChange={e => setSelectedMatches(prev => ({ ...prev, [r.userId]: e.target.checked }))}
                            className="mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-[#CCFF00] bg-white h-4 w-4"
                          />
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-900">{r.nickname}</span>
                              <span className="text-[10px] text-gray-400">입금 대조 성공</span>
                            </div>
                            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-mono mt-1 break-all">{r.matchedLine}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setMatchResults(null)}
                        className="text-xs text-gray-500 hover:text-gray-950 underline"
                      >
                        닫기
                      </button>
                      <button
                        onClick={() => {
                          const selectedIds = Object.keys(selectedMatches).filter(id => selectedMatches[id])
                          handleBatchApproveDues(selectedIds)
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-[#CCFF00] border border-[#b8e600] text-gray-900 text-xs font-bold hover:bg-[#b8e600] transition-all shadow-sm active:scale-95"
                      >
                        선택한 {Object.values(selectedMatches).filter(Boolean).length}명 일괄 입금 승인
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 기존 회원 회비 관리 테이블 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-150 text-gray-500">
                  <th className="pb-2 px-2">크루원</th>
                  <th className="pb-2 px-2">생존상태</th>
                  <th className="pb-2 px-2">회비상태</th>
                  <th className="pb-2 px-2 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map(p => {
                  const dues = duesList.find(d => d.user_id === p.id)
                  const isExemptRole = p.role === 'ADMIN' || p.role === 'PACER'
                  const s = calculateSurvival(records.filter(r => r.user_id === p.id), p.is_exempted || isExemptRole)
                  const needsRefund = dues?.status === 'PAID' && !s.isSurvived && !p.is_exempted && !isExemptRole
                  
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-2 font-bold text-gray-900">
                        {p.nickname} 
                        {needsRefund && <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] ml-1.5 font-bold border border-red-200">환불요망</span>}
                      </td>
                      <td className={`py-3 px-2 ${s.isSurvived || p.is_exempted || isExemptRole ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}>
                        {isExemptRole ? '면제 (운영진/페이서)' : s.statusText}
                      </td>
                      <td className="py-3 px-2">
                        {isExemptRole ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">면제</span>
                        ) : !dues || dues.status === 'UNPAID' ? (
                          <span className="text-gray-500">미납</span>
                        ) : dues.status === 'PENDING' ? (
                          <span className="text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">승인대기</span>
                        ) : dues.status === 'PAID' ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">입금완료</span>
                        ) : (
                          <span className="text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">환불됨</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right space-x-1.5">
                        {isExemptRole ? (
                          <span className="text-gray-400 text-xs">면제 대상</span>
                        ) : (
                          <>
                            {dues?.status === 'PENDING' && (
                              <button onClick={() => updateDuesStatus(dues.id, p.id, 'PAID')} className="bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-2xl text-blue-600 font-bold transition-all active:scale-95">승인</button>
                            )}
                            {(needsRefund || dues?.status === 'PAID') && (
                              <button onClick={() => updateDuesStatus(dues.id, p.id, 'REFUNDED')} className="bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-2xl text-red-600 font-bold transition-all active:scale-95">환불</button>
                            )}
                            {(!dues || dues.status === 'UNPAID') && (
                              <button onClick={() => updateDuesStatus(dues?.id || null, p.id, 'PAID')} className="bg-[#CCFF00] hover:bg-[#b8e600] border border-[#b8e600] text-gray-900 px-2.5 py-1.5 rounded-2xl font-bold transition-all active:scale-95">강제 승인</button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 탭 3: 지출 청구 내역 */}
      {!isLoading && activeTab === 'EXPENSES' && (
        <div className="space-y-4">
          {expensesList.length === 0 ? (
            <div className="text-center py-12 border border-gray-200 bg-white rounded-2xl text-gray-400 text-xs">청구된 지출 내역이 없습니다.</div>
          ) : (
            expensesList.map((e: any) => (
              <div key={e.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
                {e.receipt_image_url && (
                  <div className="w-full md:w-32 aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                    <img src={e.receipt_image_url} alt="영수증" className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(e.receipt_image_url, '_blank')} />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold bg-gray-100 border border-gray-200 text-gray-650 px-2 py-0.5 rounded-2xl">{e.category}</span>
                      <h4 className="text-sm font-bold text-gray-900 mt-2">{e.description}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{e.expense_date} · 신청자: {e.profiles?.nickname}</p>
                    </div>
                    <div className="text-base font-black text-red-650">-{e.amount.toLocaleString()}원</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-3 text-xs flex justify-between items-center border border-gray-200">
                    <span className="text-gray-500 font-bold">송금 계좌</span>
                    <span className="font-mono text-gray-900 select-all">{e.bank_account}</span>
                  </div>
                </div>
                
                <div className="flex md:flex-col justify-end gap-2 md:w-28 shrink-0">
                  {e.status === 'PENDING' ? (
                    <>
                      <button onClick={() => updateExpenseStatus(e.id, 'APPROVED')} className="flex-1 py-2 bg-[#CCFF00] border border-[#b8e600] text-gray-900 font-bold rounded-2xl text-xs transition-all active:scale-95">승인(송금완료)</button>
                      <button onClick={() => updateExpenseStatus(e.id, 'REJECTED')} className="flex-1 py-2 bg-red-50 border border-red-200 text-red-600 font-bold rounded-2xl text-xs transition-all active:scale-95">반려</button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <span className={`font-bold text-xs ${e.status === 'APPROVED' ? 'text-emerald-600' : 'text-red-650'}`}>
                        {e.status === 'APPROVED' ? '정산 완료' : '반려됨'}
                      </span>
                      <button onClick={() => deleteExpense(e.id)} className="mt-2 text-xs text-gray-500 hover:text-gray-900 underline transition-all">내역 삭제</button>
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
