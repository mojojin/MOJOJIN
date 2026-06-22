import React from 'react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70">
      <div className="flex flex-col items-center gap-4">
        {/* 애니메이션 스피너 */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-2xl border-4 border-gray-100"></div>
          <div className="absolute inset-0 rounded-2xl border-4 border-[#CCFF00] border-t-transparent animate-spin"></div>
        </div>
        <p className="text-xs font-bold tracking-widest text-gray-500 animate-pulse">
          로딩 중...
        </p>
      </div>
    </div>
  )
}
