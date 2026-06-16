import React from 'react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f2027]/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        {/* 애니메이션 스피너 */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#10b981] border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-bold tracking-widest text-emerald-400 animate-pulse">
          로딩 중...
        </p>
      </div>
    </div>
  )
}
