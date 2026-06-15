'use client'

import React from 'react'
import type { SurvivalStatus } from '@/utils/survival'

interface SurvivalProgressProps {
  status: SurvivalStatus
}

export default function SurvivalProgress({ status }: SurvivalProgressProps) {
  const { isExempted, isSurvived, statusText } = status

  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-sm font-bold text-gray-400">이번 달 생존 현황</span>
      <div
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-inner ${
          isExempted
            ? 'bg-[#5B7FFF]/10 border border-[#5B7FFF]/30 text-[#8BA9FF]'
            : isSurvived
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
        }`}
      >
        <span>{isExempted ? '🎈' : isSurvived ? '✅' : '🔥'}</span>
        <span>{statusText}</span>
      </div>
    </div>
  )
}
