'use client'

import React, { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  useEffect(() => {
    // Already installed as standalone app
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Check if dismissed within last 7 days
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedAt < sevenDays) return
    }

    // Small delay before showing for smoother UX
    const timer = setTimeout(() => setIsVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-300"
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div className="mx-auto max-w-lg rounded-t-2xl border border-gray-200 border-b-0 bg-white px-5 pb-8 pt-5 shadow-xl">
          {/* Handle bar */}
          <div className="mb-4 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              홈 화면에 앱 추가하기
            </h2>
            <button
              onClick={handleDismiss}
              className="rounded-2xl p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="닫기"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            브라우저 북마크가 아닌, 진짜 앱처럼 홈 화면에서 바로 실행할 수 있습니다.
          </p>

          {/* Tab buttons */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 rounded-2xl py-2.5 text-sm font-bold transition-all active:scale-[0.98] ${
                activeTab === 'ios'
                  ? 'bg-[#CCFF00] text-gray-900 border border-[#b8e600]'
                  : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              iPhone
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 rounded-2xl py-2.5 text-sm font-bold transition-all active:scale-[0.98] ${
                activeTab === 'android'
                  ? 'bg-[#CCFF00] text-gray-900 border border-[#b8e600]'
                  : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Android
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'ios' ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <Step number={1}>
                  하단의 <span className="font-bold text-gray-900">[공유 📤]</span> 버튼을 눌러주세요.
                </Step>
                <Step number={2}>
                  아래로 스크롤해서 <span className="font-bold text-gray-900">&ldquo;홈 화면에 추가&rdquo;</span>를 선택하세요.
                </Step>
                <Step number={3}>
                  우상단 <span className="font-bold text-gray-900">&ldquo;추가&rdquo;</span> 버튼을 누르면 완료!
                </Step>
              </div>
              <div className="rounded-2xl bg-yellow-50 border border-yellow-200 px-4 py-3">
                <p className="text-xs text-yellow-800 leading-relaxed">
                  Safari 브라우저에서만 가능합니다. Chrome 등 다른 앱이면 Safari로 열어주세요.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {deferredPrompt ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    아래 버튼을 누르면 기기에 앱이 바로 설치됩니다!
                  </p>
                  <button
                    onClick={async () => {
                      if (!deferredPrompt) return
                      deferredPrompt.prompt()
                      const { outcome } = await deferredPrompt.userChoice
                      if (outcome === 'accepted') {
                        setDeferredPrompt(null)
                        setIsVisible(false)
                      }
                    }}
                    className="w-full rounded-2xl bg-[#CCFF00] border border-[#b8e600] py-3.5 text-base font-extrabold text-gray-900 transition-all active:scale-[0.98]"
                  >
                    앱 설치하기
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Step number={1}>
                    Chrome 우상단 <span className="font-bold text-gray-900">더보기</span> 메뉴를 누릅니다.
                  </Step>
                  <Step number={2}>
                    <span className="font-bold text-gray-900">&ldquo;앱 설치&rdquo;</span> 또는 <span className="font-bold text-gray-900">&ldquo;홈 화면에 추가&rdquo;</span>를 선택하세요.
                  </Step>
                  <Step number={3}>
                    <span className="font-bold text-gray-900">&ldquo;설치&rdquo;</span>를 누르면 완료!
                  </Step>
                </div>
              )}
              <div className="rounded-2xl bg-yellow-50 border border-yellow-200 px-4 py-3">
                <p className="text-xs text-yellow-800 leading-relaxed">
                  브라우저나 기기에 따라 자동 설치가 안 될 수 있습니다. 그때는 위 안내를 따라주세요.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CSS animation */}
        <style jsx>{`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </>
  )
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
        {number}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed pt-0.5">{children}</p>
    </div>
  )
}
