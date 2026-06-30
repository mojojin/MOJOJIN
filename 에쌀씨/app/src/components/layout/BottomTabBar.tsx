'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const mainTabs = [
  { href: '/dashboard', label: '홈', icon: (active: boolean) => (
    <svg className={`w-5 h-5 ${active ? 'text-gray-950' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { href: '/my-records', label: '내 기록', icon: (active: boolean) => (
    <svg className={`w-5 h-5 ${active ? 'text-gray-955' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )},
  { href: '/expenses', label: '회비', icon: (active: boolean) => (
    <svg className={`w-5 h-5 ${active ? 'text-gray-955' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
]

const moreItems = [
  { href: '/calendar', label: '일정표', icon: '📅' },
  { href: '/rules', label: '규칙', icon: '📋' },
  { href: '/crew', label: '회원명부', icon: '👥' },
  { href: '/marathons', label: '마라톤', icon: '🏅' },
  { href: '/lounge', label: '이벤트', icon: '🎰' },
  { href: '/gpx', label: 'GPX 코스', icon: '🗺️' },
  { href: '/suggestions', label: '건의함', icon: '💬' },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  // 로그인 페이지, 랜딩 페이지, 관리자 화면 등에는 탭바를 노출하지 않음
  if (!pathname || pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
    return null
  }

  return (
    <>
      {/* 더보기 슬라이드업 시트 오버레이 */}
      {isMoreOpen && (
        <div 
          className="fixed inset-0 z-45 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMoreOpen(false)}
        >
          <div 
            className="absolute bottom-[60px] left-0 right-0 bg-white rounded-t-[2rem] border-t border-gray-100 p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-w-lg mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="text-xs font-bold text-gray-400 tracking-wider mb-4 px-1">더보기 메뉴</h3>
            <div className="grid grid-cols-4 gap-3">
              {moreItems.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 border ${
                      isActive
                        ? 'bg-gray-900 border-gray-900 text-white shadow-sm'
                        : 'bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}>{item.label}</span>
                  </Link>
                )
              })}
              
              {/* 외부 굿즈 링크 */}
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfwOtxX6f6UZt8d2MA66KUIRQ_CcuzCfKhocl6oC9PmdZYfPg/viewform"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsMoreOpen(false)}
                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95 border bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
              >
                <span className="text-xl">👕</span>
                <span className="text-[10px] font-bold text-gray-600">굿즈</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 하단 고정 탭바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-lg mx-auto flex items-stretch h-[60px]">
          {mainTabs.map(tab => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                  isActive ? 'text-gray-950 font-bold' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.icon(isActive)}
                <span className={`text-[9px] mt-0.5 ${isActive ? 'font-bold text-gray-950' : 'font-semibold text-gray-400'}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}

          {/* 더보기 버튼 */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
              isMoreOpen ? 'text-gray-950' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className={`w-5 h-5 ${isMoreOpen ? 'text-gray-955' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isMoreOpen ? 2.5 : 1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className={`text-[9px] mt-0.5 ${isMoreOpen ? 'font-bold text-gray-955' : 'font-semibold text-gray-400'}`}>
              더보기
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
