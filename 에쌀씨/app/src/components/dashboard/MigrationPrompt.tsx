'use client'

import React, { useState, useEffect } from 'react'

interface LegacyRecord {
  id: string
  run_type: 'PERSONAL' | 'REGULAR'
  run_date: string
  distance_km: number
  location_name: string
  is_pacing: boolean
}

interface MigrationPromptProps {
  nickname: string
}

export default function MigrationPrompt({ nickname }: MigrationPromptProps) {
  const [step, setStep] = useState<'loading' | 'hidden' | 'prompt' | 'preview' | 'migrating' | 'done' | 'declined'>('loading')
  const [records, setRecords] = useState<LegacyRecord[]>([])
  const [migratedCount, setMigratedCount] = useState(0)

  useEffect(() => {
    // 이미 팝업을 처리했으면 스킵
    const dismissed = localStorage.getItem('legacy-migration-done')
    if (dismissed) {
      setStep('hidden')
      return
    }

    // 레거시 기록 확인
    fetch('/api/legacy/check')
      .then(r => r.json())
      .then(data => {
        if (data.count && data.count > 0) {
          setRecords(data.records)
          setStep('prompt')
        } else {
          localStorage.setItem('legacy-migration-done', '1')
          setStep('hidden')
        }
      })
      .catch(() => setStep('hidden'))
  }, [])

  const handleMigrate = async () => {
    setStep('migrating')
    try {
      const res = await fetch('/api/legacy/check', { method: 'POST' })
      const data = await res.json()
      setMigratedCount(data.migrated ?? 0)
      localStorage.setItem('legacy-migration-done', '1')
      setStep('done')
    } catch {
      setStep('prompt')
      alert('이관 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const handleDecline = () => {
    localStorage.setItem('legacy-migration-done', '1')
    setStep('declined')
  }

  if (step === 'loading' || step === 'hidden' || step === 'declined') return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards' }}
      >
        <div className="mx-auto max-w-lg rounded-t-3xl bg-white px-5 pb-8 pt-5 border-t border-gray-100">
          {/* Handle */}
          <div className="flex justify-center mb-5">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>

          {/* Done 상태 */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="text-4xl">🎉</div>
              <h2 className="text-lg font-extrabold text-gray-900">기록 이관 완료!</h2>
              <p className="text-sm text-gray-500">
                <span className="text-gray-900 font-bold">{migratedCount}건</span>의 기록이<br/>
                내 러닝 기록으로 옮겨졌습니다.
              </p>
              <button
                onClick={() => setStep('hidden')}
                className="w-full py-3.5 rounded-2xl bg-[#CCFF00] text-gray-900 font-extrabold text-sm active:scale-[0.98] transition-all"
              >
                확인
              </button>
            </div>
          )}

          {/* Prompt 상태 */}
          {step === 'prompt' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  기존 기록을 옮겨드릴까요?
                </h2>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  <span className="font-bold text-gray-900">{nickname}</span> 님 명의로
                  기록된 2026년 데이터 <span className="font-bold text-gray-900">{records.length}건</span>이
                  있습니다. 내 러닝 기록으로 가져오시겠어요?
                </p>
              </div>

              {/* 미리보기 (최대 5개) */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {records.slice(0, 8).map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      r.run_type === 'REGULAR' ? 'bg-[#CCFF00] text-gray-900' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {r.run_type === 'REGULAR' ? '정기' : '개인'}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {parseFloat(String(r.distance_km)).toFixed(1)}
                      <span className="text-xs text-gray-400 font-normal"> km</span>
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">{r.run_date}</span>
                  </div>
                ))}
                {records.length > 8 && (
                  <p className="text-xs text-center text-gray-400 py-1">
                    외 {records.length - 8}건 더 있음
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleDecline}
                  className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-[0.98] transition-all"
                >
                  괜찮아요
                </button>
                <button
                  onClick={handleMigrate}
                  className="flex-[2] py-3.5 rounded-2xl bg-[#CCFF00] text-gray-900 font-extrabold text-sm active:scale-[0.98] transition-all"
                >
                  네, 가져올게요
                </button>
              </div>
            </div>
          )}

          {/* Migrating 상태 */}
          {step === 'migrating' && (
            <div className="text-center space-y-4 py-6">
              <div className="flex justify-center">
                <svg className="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500">기록을 이관하는 중...</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </>
  )
}
