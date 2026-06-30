'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Database } from '@/lib/types/database.types'
import MemberManager from './MemberManager'
import RecordViewer from './RecordViewer'
import FinanceManager from './FinanceManager'
import ScheduleManager from './ScheduleManager'
import InventoryManager from './InventoryManager'
import SuggestionManager from './SuggestionManager'

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
  const [activeTab, setActiveTab] = useState<TabId>('members')

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-150 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-4">
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
        </div>
      </header>

      {/* Tab Bar */}
      <div className="sticky top-[73px] z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
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
