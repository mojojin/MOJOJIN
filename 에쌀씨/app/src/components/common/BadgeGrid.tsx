'use client'

import React, { useState } from 'react'
import type { Badge } from '@/utils/badge'

interface BadgeGridProps {
  badges: Badge[]
  title?: string
  compact?: boolean
}

export default function BadgeGrid({ badges, title = '🏆 획득 배지 & 업적', compact = false }: BadgeGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  const unlockedCount = badges.filter(b => b.unlocked).length

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {badges.map(badge => (
          <span
            key={badge.id}
            title={`${badge.name}: ${badge.description}`}
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
              badge.unlocked
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60'
            }`}
          >
            <span>{badge.icon}</span>
            <span>{badge.name}</span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            {unlockedCount} / {badges.length} 달성
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {badges.map(badge => (
          <button
            key={badge.id}
            onClick={() => setSelectedBadge(badge)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group relative ${
              badge.unlocked
                ? 'bg-gradient-to-b from-amber-50/50 to-white border-amber-200 hover:border-amber-400 hover:shadow-md'
                : 'bg-gray-50/80 border-gray-200 grayscale opacity-60 hover:opacity-80'
            }`}
          >
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
              {badge.icon}
            </span>
            <span className="text-[11px] font-bold text-gray-900 leading-tight">
              {badge.name}
            </span>
            {badge.progressText && (
              <span className={`text-[9px] mt-1 font-medium ${badge.unlocked ? 'text-amber-700 font-bold' : 'text-gray-400'}`}>
                {badge.progressText}
              </span>
            )}
            {!badge.unlocked && (
              <span className="absolute top-1 right-1 text-[10px]">🔒</span>
            )}
          </button>
        ))}
      </div>

      {/* 배지 상세 팝업 */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center space-y-3 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-4xl shadow-inner">
              {selectedBadge.icon}
            </div>
            <div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                selectedBadge.unlocked ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}>
                {selectedBadge.unlocked ? '✅ 획득 완료' : '🔒 미달성'}
              </span>
              <h4 className="text-base font-bold text-gray-900 mt-2">{selectedBadge.name}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{selectedBadge.description}</p>
            </div>
            {selectedBadge.progressText && (
              <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-600 font-medium">
                진행 상황: <span className="font-bold text-gray-900">{selectedBadge.progressText}</span>
              </div>
            )}
            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
