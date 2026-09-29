'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pb-24">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 max-w-sm w-full text-center space-y-4">
        <div className="text-4xl">🏃♂️💨</div>
        <h2 className="text-lg font-bold text-gray-900">대시보드 로딩 실패</h2>
        <p className="text-sm text-gray-500">
          데이터를 불러오는 중 문제가 발생했습니다.
        </p>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-2xl transition-colors"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition-colors text-center"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  )
}
