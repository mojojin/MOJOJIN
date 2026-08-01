'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getKstDate, formatKstYMD } from '@/utils/date'
import {
  calculateSurvival,
  isDuesExemptRole,
  isRunningExempt,
  fetchAllRunningRecords
} from '@/utils/survival'
import type { Database } from '@/lib/types/database.types'
import MemberManager from './MemberManager'
import RecordViewer from './RecordViewer'
import FinanceManager from './FinanceManager'
import ScheduleManager from './ScheduleManager'
import InventoryManager from './InventoryManager'
import SuggestionManager from './SuggestionManager'
import DuesSettlementModal from './DuesSettlementModal'

type Profile = Database['public']['Tables']['profiles']['Row']
type Location = Database['public']['Tables']['locations']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface AdminPanelProps {
  userId: string
  profiles: Profile[]
  locations: Location[]
  records: RunningRecord[]
}

const tabs = [
  { id: 'members', label: '회원 관리', icon: '👥' },
  { id: 'records', label: '전체 기록', icon: '📊' },
  { id: 'dues', label: '재무 관리', icon: '💰' },
  { id: 'schedules', label: '일정 관리', icon: '📅' },
  { id: 'inventory', label: '비품 관리', icon: '📦' },
  { id: 'suggestions', label: '건의함 관리', icon: '💡' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function AdminPanel({ userId, profiles, locations, records }: AdminPanelProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabId>('members')
  const [isSettlementOpen, setIsSettlementOpen] = useState(false)
  const [showSettlementBanner, setShowSettlementBanner] = useState(false)
  const [settlementCount, setSettlementCount] = useState({ unpaid: 0, refund: 0 })

  const prevMonthName = useMemo(() => {
    const today = getKstDate()
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    return prevMonthDate.getMonth() + 1
  }, [])

  useEffect(() => {
    const checkSettlement = async () => {
      const today = getKstDate()
      // 월초 7일간만 정산 가이드 배너 활성화
      if (today.getDate() > 7) return

      try {
        const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const y = prevMonthDate.getFullYear()
        const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0')
        const prevMonthStr = `${y}-${m}`
        
        const startStr = `${prevMonthStr}-01`
        const lastDay = new Date(y, prevMonthDate.getMonth() + 1, 0).getDate()
        const endStr = `${prevMonthStr}-${String(lastDay).padStart(2, '0')}`

        const [dRes, rRes] = await Promise.all([
          supabase.from('dues').select('*').eq('target_month', prevMonthStr).limit(5000),
          fetchAllRunningRecords(supabase, 'user_id, distance_km', startStr, endStr)
        ])

        if (dRes.error) throw dRes.error
        const prevDuesList = dRes.data || []
        const prevRecordsList = rRes || []

        const activeRegulars = profiles.filter(
          p => p.role !== 'WAITING' && p.is_active && !p.kakao_id?.startsWith('mock_')
        )

        let unpaid = 0
        let refund = 0

        activeRegulars.forEach(p => {
          const dues = prevDuesList.find(d => d.user_id === p.id) || null
          const isExempted = isDuesExemptRole(p.role)
          const isRunExempt = isRunningExempt(p, prevMonthStr)
          
          const userRuns = prevRecordsList.filter(r => r.user_id === p.id)
          const survival = calculateSurvival(userRuns, isRunExempt)

          if (!isExempted) {
            if (!dues || dues.status === 'UNPAID' || dues.status === 'PENDING') {
              unpaid++
            }
          }

          if (!isExempted && dues && dues.status === 'PAID' && !survival.isSurvived) {
            refund++
          }
        })

        if (unpaid > 0 || refund > 0) {
          setSettlementCount({ unpaid, refund })
          setShowSettlementBanner(true)
        } else {
          setShowSettlementBanner(false)
        }
      } catch (err) {
        console.error('Failed to check settlement targets:', err)
      }
    }

    checkSettlement()
  }, [profiles, supabase])

  const handleSettlementProcessed = () => {
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Sticky Header & Tab Bar Group */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        {/* Header */}
        <header className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900 active:scale-[0.95]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">관리자 패널</h1>
                <p className="text-xs text-gray-500">수원러닝크루 관리</p>
              </div>
            </div>
            <div className="flex h-8 items-center rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-3">
              <span className="text-xs font-bold text-gray-900">ADMIN</span>
            </div>
          </div>
        </header>

        {/* Tab Bar */}
        <div className="mx-auto max-w-4xl">
          <div className="relative flex overflow-x-auto whitespace-nowrap scrollbar-hide px-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex shrink-0 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-gray-950 font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                {/* Animated indicator */}
                {activeTab === tab.id && (
                  <span
                    className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#CCFF00]"
                    style={{
                      animation: 'slideIn 0.2s ease-out',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 정산 알림 배너 */}
      {showSettlementBanner && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border-b border-red-100/50 px-4 py-3">
          <div className="mx-auto max-w-4xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">📢</span>
              <p className="text-xs text-gray-700 font-bold">
                지난달({prevMonthName}월) 회비 미납 탈락자 <span className="text-red-650 font-extrabold">{settlementCount.unpaid}명</span> / 미인증 환불 대상 <span className="text-amber-600 font-extrabold">{settlementCount.refund}명</span>이 대기 중입니다.
              </p>
            </div>
            <button
              onClick={() => setIsSettlementOpen(true)}
              className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-[0.95] self-start sm:self-auto"
            >
              정산 가이드 열기
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {activeTab === 'members' && (
          <MemberManager initialProfiles={profiles} records={records} />
        )}
        {activeTab === 'records' && (
          <RecordViewer initialRecords={records} profiles={profiles} />
        )}
        {activeTab === 'dues' && (
          <FinanceManager initialProfiles={profiles} currentUserId={userId} />
        )}
        {activeTab === 'schedules' && (
          <ScheduleManager userId={userId} locations={locations} />
        )}
        {activeTab === 'inventory' && (
          <InventoryManager />
        )}
        {activeTab === 'suggestions' && (
          <SuggestionManager />
        )}
      </main>

      {/* 정산 모달 */}
      <DuesSettlementModal
        isOpen={isSettlementOpen}
        onClose={() => setIsSettlementOpen(false)}
        profiles={profiles}
        onSettlementProcessed={handleSettlementProcessed}
      />

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) scaleX(0.5);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scaleX(1);
          }
        }
      `}</style>
    </div>
  )
}
