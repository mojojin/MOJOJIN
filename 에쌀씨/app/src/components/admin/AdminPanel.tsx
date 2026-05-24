'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Database } from '@/lib/types/database.types'
import MemberManager from './MemberManager'
import LocationManager from './LocationManager'
import RecordViewer from './RecordViewer'

type Profile = Database['public']['Tables']['profiles']['Row']
type Location = Database['public']['Tables']['locations']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface AdminPanelProps {
  profiles: Profile[]
  locations: Location[]
  records: RunningRecord[]
}

const tabs = [
  { id: 'members', label: '회원 관리', icon: '👥' },
  { id: 'locations', label: '장소 관리', icon: '📍' },
  { id: 'records', label: '전체 기록', icon: '📊' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function AdminPanel({ profiles, locations, records }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('members')

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-[0.95]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-white">관리자 패널</h1>
                <p className="text-xs text-gray-500">수원러닝크루 관리</p>
              </div>
            </div>
            <div className="flex h-8 items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3">
              <span className="text-xs font-medium text-emerald-400">ADMIN</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="sticky top-[73px] z-40 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
                {/* Animated indicator */}
                {activeTab === tab.id && (
                  <span
                    className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
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
          <MemberManager initialProfiles={profiles} />
        )}
        {activeTab === 'locations' && (
          <LocationManager initialLocations={locations} />
        )}
        {activeTab === 'records' && (
          <RecordViewer initialRecords={records} profiles={profiles} />
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
