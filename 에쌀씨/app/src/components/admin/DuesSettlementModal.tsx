'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  calculateSurvival,
  isDuesExemptRole,
  isRunningExempt,
  fetchAllRunningRecords
} from '@/utils/survival'
import { getKstDate } from '@/utils/date'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Dues = Database['public']['Tables']['dues']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface DuesSettlementModalProps {
  isOpen: boolean
  onClose: () => void
  profiles: Profile[]
  onSettlementProcessed?: () => void
}

export default function DuesSettlementModal({
  isOpen,
  onClose,
  profiles,
  onSettlementProcessed
}: DuesSettlementModalProps) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'UNPAID' | 'REFUND'>('UNPAID')
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  
  const [prevDuesList, setPrevDuesList] = useState<Dues[]>([])
  const [prevRecords, setPrevRecords] = useState<RunningRecord[]>([])

  // 이전 달 구하기 (KST 기준)
  const prevMonthStr = useMemo(() => {
    const today = getKstDate()
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const y = prevMonthDate.getFullYear()
    const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }, [])

  const loadData = async () => {
    if (!isOpen) return
    setIsLoading(true)
    try {
      const [y, m] = prevMonthStr.split('-').map(Number)
      const startStr = `${prevMonthStr}-01`
      const lastDay = new Date(y, m, 0).getDate()
      const endStr = `${prevMonthStr}-${String(lastDay).padStart(2, '0')}`

      const [dRes, rRes] = await Promise.all([
        supabase.from('dues').select('*').eq('target_month', prevMonthStr).limit(5000),
        fetchAllRunningRecords(supabase, '*', startStr, endStr)
      ])

      if (dRes.error) throw dRes.error
      setPrevDuesList(dRes.data || [])
      setPrevRecords(rRes || [])
    } catch (err) {
      console.error('Failed to load settlement data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [isOpen])

  // 정식 회원 중 정산 및 탈락 대상 계산
  const targetMembers = useMemo(() => {
    const activeRegulars = profiles.filter(
      p => p.role !== 'WAITING' && p.is_active && !p.kakao_id?.startsWith('mock_')
    )

    const unpaidList: { profile: Profile; dues: Dues | null }[] = []
    const refundList: { profile: Profile; dues: Dues; totalDays: number }[] = []

    activeRegulars.forEach(p => {
      const dues = prevDuesList.find(d => d.user_id === p.id) || null
      const isExempted = isDuesExemptRole(p.role)
      const isRunExempt = isRunningExempt(p, prevMonthStr)
      
      const userRuns = prevRecords.filter(r => r.user_id === p.id)
      const survival = calculateSurvival(userRuns, isRunExempt)

      // 1. 미납 탈락 대상 (운영진 제외 + 미납/대기)
      if (!isExempted) {
        if (!dues || dues.status === 'UNPAID' || dues.status === 'PENDING') {
          unpaidList.push({ profile: p, dues })
        }
      }

      // 2. 미인증 환불 대상 (운영진 제외 + 회비는 냈는데 생존 실패)
      if (!isExempted && dues && dues.status === 'PAID' && !survival.isSurvived) {
        refundList.push({ profile: p, dues, totalDays: survival.totalDays })
      }
    })

    return { unpaidList, refundList }
  }, [profiles, prevDuesList, prevRecords, prevMonthStr])

  // 검색 필터링 적용 목록
  const filteredUnpaidList = useMemo(() => {
    return targetMembers.unpaidList.filter(item =>
      item.profile.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [targetMembers.unpaidList, searchTerm])

  const filteredRefundList = useMemo(() => {
    return targetMembers.refundList.filter(item =>
      item.profile.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [targetMembers.refundList, searchTerm])

  // 강퇴 처리
  const handleKick = async (id: string, nickname: string) => {
    if (!confirm(`정말 ${nickname} 회원을 탈퇴/강퇴 처리하시겠습니까?\n(데이터는 보존되며 로그인만 차단됩니다.)`)) return
    setActionInProgress(id)
    try {
      await supabase.from('dues').delete().eq('user_id', id)
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      alert(`${nickname}님이 강퇴 처리되었습니다.`)
      await loadData()
      if (onSettlementProcessed) onSettlementProcessed()
    } catch (err: any) {
      console.error(err)
      alert('강퇴 처리 중 오류가 발생했습니다: ' + (err.message || err))
    } finally {
      setActionInProgress(null)
    }
  }

  // 납부 승인 처리
  const handleApprovePayment = async (profileId: string, duesId: string | null) => {
    setActionInProgress(profileId)
    try {
      if (duesId) {
        const { error } = await supabase
          .from('dues')
          .update({ status: 'PAID' })
          .eq('id', duesId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('dues')
          .insert({
            user_id: profileId,
            target_month: prevMonthStr,
            status: 'PAID'
          })
        if (error) throw error
      }
      alert('납부 확인 처리가 완료되었습니다.')
      await loadData()
      if (onSettlementProcessed) onSettlementProcessed()
    } catch (err: any) {
      console.error(err)
      alert('납부 처리 중 오류가 발생했습니다: ' + (err.message || err))
    } finally {
      setActionInProgress(null)
    }
  }

  // 환불 완료 처리 (DUES 상태를 REFUNDED로)
  const handleRefund = async (profileId: string, duesId: string) => {
    if (!confirm('환불 완료 처리를 진행하시겠습니까? (회비 상태가 환불 완료로 마킹됩니다.)')) return
    setActionInProgress(profileId)
    try {
      const { error } = await supabase
        .from('dues')
        .update({ status: 'REFUNDED' })
        .eq('id', duesId)
      if (error) throw error

      alert('환불 완료 마킹이 적용되었습니다.')
      await loadData()
      if (onSettlementProcessed) onSettlementProcessed()
    } catch (err: any) {
      console.error(err)
      alert('환불 처리 중 오류가 발생했습니다: ' + (err.message || err))
    } finally {
      setActionInProgress(null)
    }
  }

  // 회비 납부 기록 삭제 (잘못 기입된 경우 미납 상태로 전환)
  const handleDeleteDues = async (profileId: string, nickname: string) => {
    if (!confirm(`정말 ${nickname} 회원의 ${prevMonthStr.split('-')[1]}월 회비 납부 기록을 삭제하시겠습니까?\n(삭제 시 미인증 환불 대상에서 제외되며 회비 미납 상태로 전환됩니다.)`)) return
    setActionInProgress(profileId)
    try {
      const { error } = await supabase
        .from('dues')
        .delete()
        .eq('user_id', profileId)
        .eq('target_month', prevMonthStr)

      if (error) throw error

      alert(`${nickname}님의 회비 납부 기록이 삭제되었습니다.`)
      await loadData()
      if (onSettlementProcessed) onSettlementProcessed()
    } catch (err: any) {
      console.error(err)
      alert('기록 삭제 중 오류가 발생했습니다: ' + (err.message || err))
    } finally {
      setActionInProgress(null)
    }
  }

  // 예외 인정 처리 (이상 없음 - 생존 상태 수동 승인)
  const handleExempt = async (profileId: string, nickname: string) => {
    if (!confirm(`정말 ${nickname} 회원을 예외 인정(이상 없음) 처리하시겠습니까?\n(승인 시 미인증 환불 대상에서 제외되며 크루원 자격이 그대로 유지됩니다.)`)) return
    setActionInProgress(profileId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_exempted: true })
        .eq('id', profileId)

      if (error) throw error

      alert(`${nickname}님이 예외 인정(이상 없음) 처리되어 정상 크루원으로 유지되었습니다.`)
      await loadData()
      if (onSettlementProcessed) onSettlementProcessed()
    } catch (err: any) {
      console.error(err)
      alert('예외 인정 처리 중 오류가 발생했습니다: ' + (err.message || err))
    } finally {
      setActionInProgress(null)
    }
  }


  if (!isOpen) return null

  const [monthY, monthM] = prevMonthStr.split('-')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-[32px] border border-gray-100 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* 모달 헤더 */}
        <div className="bg-gray-50 border-b border-gray-100 p-6 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
              <span className="text-xl">📢</span> {monthY}년 {parseInt(monthM)}월 정산 현황판
            </h3>
            <p className="text-xs text-gray-400 font-bold">
              지난달 미납 크루원 강퇴 처리 및 미인증 환불 대상자를 정밀 검증하고 처리합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-250 bg-white text-gray-400 hover:text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* 요약 메트릭 카드 영역 */}
        <div className="grid grid-cols-3 gap-4 px-6 pt-5 pb-2">
          <div className="bg-gray-50/50 border border-gray-100 p-3.5 rounded-2xl space-y-1 text-center">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase">총 정산 대상</span>
            <div className="text-xl font-black text-gray-900">
              {targetMembers.unpaidList.length + targetMembers.refundList.length}명
            </div>
          </div>
          <div className="bg-red-50/30 border border-red-100/50 p-3.5 rounded-2xl space-y-1 text-center">
            <span className="text-[10px] text-red-500 font-extrabold uppercase">회비 미납</span>
            <div className="text-xl font-black text-red-650">
              {targetMembers.unpaidList.length}명
            </div>
          </div>
          <div className="bg-amber-50/30 border border-amber-100/50 p-3.5 rounded-2xl space-y-1 text-center">
            <span className="text-[10px] text-amber-500 font-extrabold uppercase">미인증 환불</span>
            <div className="text-xl font-black text-amber-650">
              {targetMembers.refundList.length}명
            </div>
          </div>
        </div>

        {/* 검색 및 탭 필터바 */}
        <div className="px-6 py-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          {/* 탭 버튼 그룹 */}
          <div className="flex gap-1.5 p-1 bg-gray-50 border border-gray-100 rounded-2xl self-start w-full md:w-auto">
            <button
              onClick={() => {
                setActiveTab('UNPAID')
                setSearchTerm('')
              }}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                activeTab === 'UNPAID'
                  ? 'bg-white text-red-650 shadow-sm border border-red-100/80'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ⚠️ 회비 미납 ({targetMembers.unpaidList.length}명)
            </button>
            <button
              onClick={() => {
                setActiveTab('REFUND')
                setSearchTerm('')
              }}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                activeTab === 'REFUND'
                  ? 'bg-white text-amber-650 shadow-sm border border-amber-100/80'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              💸 미인증 환불 ({targetMembers.refundList.length}명)
            </button>
          </div>

          {/* 검색창 */}
          <div className="relative flex-1 max-w-xs w-full md:w-auto self-end md:self-auto">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all placeholder-gray-400"
            />
          </div>
        </div>

        {/* 테이블 본문 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-2 min-h-[300px] bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-extrabold">정산 데이터를 로드하고 있습니다...</p>
            </div>
          ) : activeTab === 'UNPAID' ? (
            filteredUnpaidList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 text-xs gap-1.5">
                <span className="text-3xl">🎉</span>
                <p className="font-extrabold text-gray-700">미납 대상 크루원이 없습니다.</p>
                <p className="text-[10px] text-gray-400 leading-normal">
                  {searchTerm ? '검색 필터에 일치하는 회원이 없습니다.' : '지난달 회비 정산이 모두 깔끔하게 완료되었습니다.'}
                </p>
              </div>
            ) : (
              <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                      <th className="py-2.5 px-4">크루원 정보</th>
                      <th className="py-2.5 px-4">현황 상태</th>
                      <th className="py-2.5 px-4 text-right">정산 처리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {filteredUnpaidList.map(({ profile, dues }) => (
                      <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-xs text-gray-900">{profile.nickname}</div>
                          <div className="text-[10px] text-gray-450 font-semibold mt-0.5">
                            연락처: {profile.phone || '-'} | 가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold ${
                            dues?.status === 'PENDING' 
                              ? 'bg-amber-50 text-amber-600 border-amber-150' 
                              : 'bg-red-50 text-red-600 border-red-150'
                          }`}>
                            {dues?.status === 'PENDING' ? '납부 승인 대기' : '회비 미납'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleApprovePayment(profile.id, dues?.id || null)}
                              disabled={actionInProgress === profile.id}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                              납부 확인
                            </button>
                            <button
                              onClick={() => handleKick(profile.id, profile.nickname)}
                              disabled={actionInProgress === profile.id}
                              className="px-2.5 py-1.5 rounded-xl bg-red-50 text-red-650 border border-red-100 hover:bg-red-100 text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                              강퇴
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            filteredRefundList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 text-xs gap-1.5">
                <span className="text-3xl">🎉</span>
                <p className="font-extrabold text-gray-700">환불 대상 크루원이 없습니다.</p>
                <p className="text-[10px] text-gray-400 leading-normal">
                  {searchTerm ? '검색 필터에 일치하는 회원이 없습니다.' : '생존 실패자 정산이 모두 깔끔하게 완료되었습니다.'}
                </p>
              </div>
            ) : (
              <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                      <th className="py-2.5 px-4">크루원 정보</th>
                      <th className="py-2.5 px-4">생존 실패 상세</th>
                      <th className="py-2.5 px-4 text-right">정산 처리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {filteredRefundList.map(({ profile, dues, totalDays }) => (
                      <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-xs text-gray-900">{profile.nickname}</div>
                          <div className="text-[10px] text-gray-450 font-semibold mt-0.5">
                            연락처: {profile.phone || '-'} | 납부일: {new Date(dues.updated_at || '').toLocaleDateString('ko-KR')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-150 font-bold">
                            미인증 (달성: {totalDays}회)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            {dues.status === 'PAID' ? (
                              <button
                                onClick={() => handleRefund(profile.id, dues.id)}
                                disabled={actionInProgress === profile.id}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 text-[10px] font-bold transition-all disabled:opacity-50"
                              >
                                환불 완료 마크
                              </button>
                            ) : (
                              <span className="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-650 border border-purple-100 text-[10px] font-bold">
                                환불 완료됨
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteDues(profile.id, profile.nickname)}
                              disabled={actionInProgress === profile.id}
                              className="px-2.5 py-1.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                              기록 삭제
                            </button>
                            <button
                              onClick={() => handleExempt(profile.id, profile.nickname)}
                              disabled={actionInProgress === profile.id}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                              예외 인정
                            </button>
                            <button
                              onClick={() => handleKick(profile.id, profile.nickname)}
                              disabled={actionInProgress === profile.id}
                              className="px-2.5 py-1.5 rounded-xl bg-red-50 text-red-650 border border-red-100 hover:bg-red-100 text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                              강퇴
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="bg-gray-50 border-t border-gray-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-gray-400 font-bold">
          <span>※ 강퇴 처리 시 로그인 권한만 차단되며, 기존 누적 러닝 기록은 소실되지 않습니다.</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-bold transition-all active:scale-[0.97]"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  )
}
