'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pb-24">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 max-w-sm w-full text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-bold text-gray-900">오류가 발생했습니다</h2>
        <p className="text-sm text-gray-500">
          잠시 후 다시 시도해 주세요.
        </p>
        <button
          onClick={reset}
          className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-2xl transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
