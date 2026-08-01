'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  calculateSurvival,
  isDuesExemptRole,
  isRunningExempt,
  fetchAllRunningRecords
} from '@/utils/survival'
import { getKstDate, formatKstYMD } from '@/utils/date'
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

  // 강퇴 처리
  const handleKick = async (id: string, nickname: string) => {
    if (!confirm(`정말 ${nickname} 회원을 탈퇴/강퇴 처리하시겠습니까?\n(데이터는 보존되며 로그인만 차단됩니다.)`)) return
    setActionInProgress(id)
    try {
      // 1. 회비 명단 삭제
      await supabase.from('dues').delete().eq('user_id', id)
      
      // 2. 프로필 비활성화
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      alert(`${nickname}님이 강퇴 처리되었습니다.`)
      
      // 목록 리로드 및 부모 리프레시 유도
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

  if (!isOpen) return null

  const [monthY, monthM] = prevMonthStr.split('-')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-gray-150 p-6 shadow-xl flex flex-col max-h-[85vh]">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="space-y-0.5">
            <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-1.5">
              📢 {monthY}년 {parseInt(monthM)}월 정산 가이드
            </h3>
            <p className="text-[11px] text-gray-400 font-semibold">
              지난달 미납 및 생존 미인증 크루원 강퇴/환불 정산 가이드입니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all"
          >
            ✕
          </button>
        </div>

        {/* 탭 전환기 */}
        <div className="flex gap-2 p-1 bg-gray-50 border border-gray-100 rounded-2xl mt-4">
          <button
            onClick={() => setActiveTab('UNPAID')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
              activeTab === 'UNPAID'
                ? 'bg-white text-red-600 shadow-sm border border-red-100'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ⚠️ 회비 미납 탈락자 ({targetMembers.unpaidList.length}명)
          </button>
          <button
            onClick={() => setActiveTab('REFUND')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
              activeTab === 'REFUND'
                ? 'bg-white text-amber-600 shadow-sm border border-amber-100'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            💸 미인증 환불 대상 ({targetMembers.refundList.length}명)
          </button>
        </div>

        {/* 리스트 본문 */}
        <div className="flex-1 overflow-y-auto py-4 min-h-[250px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-semibold">정산 대상 조회 중...</p>
            </div>
          ) : activeTab === 'UNPAID' ? (
            targetMembers.unpaidList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 text-xs">
                <span className="text-2xl mb-1">🎉</span>
                <p className="font-bold">7월 회비 미납 탈락자가 없습니다.</p>
                <p className="text-[10px] mt-0.5">정산이 모두 깔끔하게 완료되었습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-150">
                {targetMembers.unpaidList.map(({ profile, dues }) => (
                  <div key={profile.id} className="flex items-center justify-between py-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-950">{profile.nickname}</span>
                        <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-150 font-bold">
                          {dues?.status === 'PENDING' ? '납부 승인 대기' : '회비 미납'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold">
                        연락처: {profile.phone || '-'} | 가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>

                    <div className="flex gap-1.5">
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
                  </div>
                ))}
              </div>
            )
          ) : (
            targetMembers.refundList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 text-xs">
                <span className="text-2xl mb-1">🎉</span>
                <p className="font-bold">7월 미인증 환불 대상자가 없습니다.</p>
                <p className="text-[10px] mt-0.5">인증 실패자에 대한 강퇴/환불 처리가 완료되었습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-150">
                {targetMembers.refundList.map(({ profile, dues, totalDays }) => (
                  <div key={profile.id} className="flex items-center justify-between py-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-950">{profile.nickname}</span>
                        <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-150 font-bold">
                          미인증 (달성: {totalDays}회)
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold">
                        연락처: {profile.phone || '-'} | 납부일: {new Date(dues.updated_at || '').toLocaleDateString('ko-KR')}
                      </p>
                    </div>

                    <div className="flex gap-1.5">
                      {dues.status === 'PAID' ? (
                        <button
                          onClick={() => handleRefund(profile.id, dues.id)}
                          disabled={actionInProgress === profile.id}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 text-[10px] font-bold transition-all disabled:opacity-50"
                        >
                          환불 완료 마크
                        </button>
                      ) : (
                        <span className="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold">
                          환불 완료됨
                        </span>
                      )}
                      <button
                        onClick={() => handleKick(profile.id, profile.nickname)}
                        disabled={actionInProgress === profile.id}
                        className="px-2.5 py-1.5 rounded-xl bg-red-50 text-red-650 border border-red-100 hover:bg-red-100 text-[10px] font-bold transition-all disabled:opacity-50"
                      >
                        강퇴
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* 푸터 */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-semibold">
          <span>※ 강퇴 처리 시 로그인 권한만 차단되며, 기존 데이터는 소실되지 않습니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  )
}
