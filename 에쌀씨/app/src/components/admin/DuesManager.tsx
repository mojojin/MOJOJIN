'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateSurvival } from '@/utils/survival'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type DuesRow = Database['public']['Tables']['dues']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface DuesManagerProps {
  initialProfiles: Profile[]
}

interface MemberDuesInfo {
  profile: Profile
  dues: DuesRow | null
  survivalStatus: ReturnType<typeof calculateSurvival>
  needsRefund: boolean
}

type FilterType = 'ALL' | 'PENDING' | 'REFUND_NEEDED' | 'UNPAID' | 'PAID'

export default function DuesManager({ initialProfiles }: DuesManagerProps) {
  const supabase = createClient() as any
  const [profiles] = useState<Profile[]>(initialProfiles.filter(p => p.role !== 'WAITING' && p.is_active))
  const [duesList, setDuesList] = useState<DuesRow[]>([])
  const [records, setRecords] = useState<RunningRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 이번 달 회비 정보
        const { data: dData, error: dError } = await supabase
          .from('dues')
          .select('*')
          .eq('target_month', currentMonthStr)
        if (dError) throw dError

        // 이번 달 러닝 기록
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        
        const formatDate = (date: Date) => {
          const y = date.getFullYear()
          const m = String(date.getMonth() + 1).padStart(2, '0')
          const d = String(date.getDate()).padStart(2, '0')
          return `${y}-${m}-${d}`
        }

        const { data: rData, error: rError } = await supabase
          .from('running_records')
          .select('*')
          .gte('run_date', formatDate(startOfMonth))
          .lte('run_date', formatDate(endOfMonth))
        if (rError) throw rError

        setDuesList(dData || [])
        setRecords(rData || [])
      } catch (err) {
        console.error('Failed to fetch dues/records:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [supabase, currentMonthStr])

  // 상태 변경 핸들러
  const handleUpdateStatus = async (userId: string, currentDues: DuesRow | null, newStatus: DuesRow['status']) => {
    setActionInProgress(userId)
    try {
      if (currentDues) {
        const { error } = await supabase
          .from('dues')
          .update({ status: newStatus })
          .eq('id', currentDues.id)
        if (error) throw error

        setDuesList(prev => prev.map(d => d.id === currentDues.id ? { ...d, status: newStatus } : d))
      } else {
        const { data, error } = await supabase
          .from('dues')
          .insert({
            user_id: userId,
            target_month: currentMonthStr,
            status: newStatus,
            amount: 10000
          })
          .select()
          .single()
        if (error) throw error
        if (data) setDuesList(prev => [...prev, data])
      }
    } catch (err) {
      console.error('Update status failed:', err)
      alert('상태 업데이트 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  // 통합 데이터 생성
  const processedData: MemberDuesInfo[] = profiles.map(profile => {
    const userDues = duesList.find(d => d.user_id === profile.id) || null
    const userRecords = records.filter(r => r.user_id === profile.id)
    const survivalStatus = calculateSurvival(userRecords, profile.is_exempted)
    
    // 입금은 했는데 생존에 실패했다면 환불 필요 (강퇴 대상자)
    const needsRefund = userDues?.status === 'PAID' && !survivalStatus.isSurvived && !profile.is_exempted
    
    return { profile, dues: userDues, survivalStatus, needsRefund }
  })

  // 필터링 적용
  const filteredData = processedData.filter(item => {
    if (filter === 'ALL') return true
    if (filter === 'REFUND_NEEDED') return item.needsRefund
    
    const status = item.dues?.status || 'UNPAID'
    if (filter === 'PENDING') return status === 'PENDING'
    if (filter === 'PAID') return status === 'PAID'
    if (filter === 'UNPAID') return status === 'UNPAID'
    
    return true
  })

  // 통계
  const stats = {
    pending: processedData.filter(i => i.dues?.status === 'PENDING').length,
    refundNeeded: processedData.filter(i => i.needsRefund).length,
    paid: processedData.filter(i => i.dues?.status === 'PAID').length,
    unpaid: processedData.filter(i => (i.dues?.status || 'UNPAID') === 'UNPAID').length
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div 
          onClick={() => setFilter('PENDING')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${filter === 'PENDING' ? 'bg-blue-500/20 border-blue-500/40' : 'bg-gray-900/40 border-white/5 hover:bg-gray-900/60'}`}
        >
          <div className="text-xs font-bold text-gray-400 mb-1">입금 확인 요청</div>
          <div className="text-2xl font-black text-blue-400">{stats.pending}명</div>
        </div>
        <div 
          onClick={() => setFilter('REFUND_NEEDED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${filter === 'REFUND_NEEDED' ? 'bg-red-500/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-gray-900/40 border-white/5 hover:bg-gray-900/60'}`}
        >
          <div className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1">🚨 환불 필요</div>
          <div className="text-2xl font-black text-white">{stats.refundNeeded}명</div>
        </div>
        <div 
          onClick={() => setFilter('PAID')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${filter === 'PAID' ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-gray-900/40 border-white/5 hover:bg-gray-900/60'}`}
        >
          <div className="text-xs font-bold text-gray-400 mb-1">입금 완료</div>
          <div className="text-2xl font-black text-emerald-400">{stats.paid}명</div>
        </div>
        <div 
          onClick={() => setFilter('UNPAID')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${filter === 'UNPAID' ? 'bg-gray-800 border-gray-600' : 'bg-gray-900/40 border-white/5 hover:bg-gray-900/60'}`}
        >
          <div className="text-xs font-bold text-gray-400 mb-1">미납</div>
          <div className="text-2xl font-black text-gray-300">{stats.unpaid}명</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          전체 보기
        </button>
      </div>

      {/* 리스트 */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-sm p-6 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500 font-medium">
            해당 조건에 맞는 회원이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3 px-2">크루원</th>
                  <th className="pb-3 px-2">생존 상태</th>
                  <th className="pb-3 px-2">회비 상태</th>
                  <th className="pb-3 px-2 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.map(({ profile, dues, survivalStatus, needsRefund }) => {
                  const currentStatus = dues?.status || 'UNPAID'
                  const isProcessing = actionInProgress === profile.id
                  
                  return (
                    <tr key={profile.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{profile.nickname}</span>
                          {needsRefund && <span className="px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[9px] font-bold">환불 필요</span>}
                          {profile.is_exempted && <span className="px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-400 text-[9px] font-bold">면제자</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <div className={`text-xs font-bold ${survivalStatus.isSurvived || profile.is_exempted ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {survivalStatus.statusText}
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center">
                          {currentStatus === 'UNPAID' && <span className="text-xs text-gray-500 font-medium">미납</span>}
                          {currentStatus === 'PENDING' && <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">확인 요청 ⏳</span>}
                          {currentStatus === 'PAID' && <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">입금 완료 ✅</span>}
                          {currentStatus === 'REFUNDED' && <span className="text-xs text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full">환불 완료 💸</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {currentStatus === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(profile.id, dues, 'PAID')}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold transition-all disabled:opacity-50"
                            >
                              승인
                            </button>
                          )}
                          {needsRefund && currentStatus === 'PAID' && (
                            <button
                              onClick={() => handleUpdateStatus(profile.id, dues, 'REFUNDED')}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[11px] font-bold transition-all disabled:opacity-50"
                            >
                              환불 처리
                            </button>
                          )}
                          {(currentStatus === 'UNPAID' || currentStatus === 'REFUNDED') && (
                            <button
                              onClick={() => handleUpdateStatus(profile.id, dues, 'PAID')}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-bold transition-all disabled:opacity-50"
                            >
                              강제 완료
                            </button>
                          )}
                          {(currentStatus === 'PAID' && !needsRefund) && (
                            <button
                              onClick={() => handleUpdateStatus(profile.id, dues, 'UNPAID')}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-500 hover:bg-white/5 hover:text-gray-400 text-[11px] font-bold transition-all disabled:opacity-50"
                            >
                              취소
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
