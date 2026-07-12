'use client'

import React from 'react'
import Link from 'next/link'

import { isAdminRole } from '@/utils/survival'

interface QuickAccessGridProps {
  userRole: string
  onLogout: () => void
}

export default function QuickAccessGrid({ userRole, onLogout }: QuickAccessGridProps) {
  const isAdmin = isAdminRole(userRole as any)

  // 크루 라운지 4개 아이템 정의
  const loungeItems = [
    { href: '/marathons', label: '마라톤', icon: '🏅', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { href: '/lounge', label: '이벤트', icon: '🎰', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { href: '/suggestions', label: '건의함', icon: '💬', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { href: '/gpx', label: 'GPX 코스', icon: '🗺️', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  ]

  return (
    <div className="space-y-6">
      {/* 퀵 메뉴 가로 스크롤/그리드 */}
      <div className="grid grid-cols-4 gap-2.5">
        <Link
          href="/calendar"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-150 py-3 hover:bg-gray-100 transition-all active:scale-[0.97]"
        >
          <span className="text-base">📅</span>
          <span className="text-[10px] font-bold text-gray-600">일정표</span>
        </Link>

        <Link
          href="/rules"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-150 py-3 hover:bg-gray-100 transition-all active:scale-[0.97]"
        >
          <span className="text-base">📋</span>
          <span className="text-[10px] font-bold text-gray-600">규칙</span>
        </Link>

        {userRole !== 'WAITING' ? (
          <Link
            href="/crew"
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-150 py-3 hover:bg-gray-100 transition-all active:scale-[0.97]"
          >
            <span className="text-base">👥</span>
            <span className="text-[10px] font-bold text-gray-600">회원명부</span>
          </Link>
        ) : (
          <div className="opacity-40 cursor-not-allowed flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-150 py-3">
            <span className="text-base">👥</span>
            <span className="text-[10px] font-bold text-gray-600">회원명부</span>
          </div>
        )}

        {isAdmin ? (
          <Link
            href="/admin"
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-150 py-3 hover:bg-gray-100 transition-all active:scale-[0.97]"
          >
            <span className="text-base">⚙️</span>
            <span className="text-[10px] font-bold text-gray-600">관리자</span>
          </Link>
        ) : (
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-150 py-3 hover:bg-gray-100 transition-all active:scale-[0.97]"
          >
            <span className="text-base">🚪</span>
            <span className="text-[10px] font-bold text-gray-550">로그아웃</span>
          </button>
        )}
      </div>

      {/* 크루 라운지 섹션 */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 tracking-wider px-1">크루 라운지</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {loungeItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all text-center shadow-sm"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border text-base mb-1 ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-800 leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 굿즈 신청 섹션 */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 tracking-wider px-1">SRC 굿즈 신청</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/goods"
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all shadow-sm group"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-amber-100 bg-amber-50 text-base shrink-0">
              👕
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-gray-900 block leading-none">SRC 티셔츠</span>
              <span className="text-[9px] text-gray-400 mt-1 block leading-none">앱에서 간편 신청</span>
            </div>
          </Link>

          <Link
            href="/goods"
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white border border-gray-200 hover:bg-gray-55 active:scale-[0.97] transition-all shadow-sm group"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-sky-100 bg-sky-50 text-base shrink-0">
              🧦
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-gray-900 block leading-none">SRC 러닝 양말</span>
              <span className="text-[9px] text-gray-400 mt-1 block leading-none">앱에서 간편 신청</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
