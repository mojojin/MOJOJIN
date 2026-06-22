'use client'

import React from 'react'
import type { SurvivalStatus } from '@/utils/survival'

interface SurvivalProgressProps {
  status: SurvivalStatus
}

export default function SurvivalProgress({ status }: SurvivalProgressProps) {
  const { isExempted, isSurvived, statusText } = status

  return (
    <div className="flex items-center gap-2 px-2">
      <span className="text-sm font-bold text-gray-500">이번 달 생존 현황</span>
      <div
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
          isExempted
            ? 'bg-blue-50 text-blue-600 border border-blue-200'
            : isSurvived
            ? 'bg-[#CCFF00] text-gray-900 border border-[#b8e600]'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}
      >
        <span>{statusText}</span>
      </div>
    </div>
  )
}
