'use client'

import React from 'react'
import Link from 'next/link'
import type { Database } from '@/lib/types/database.types'

type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface MonthlyRecordListProps {
  records: RunningRecord[]
  selectedDate: Date
  isCurrentMonth: boolean
  deletingId: string | null
  showAllRecords: boolean
  onDeleteRecord: (id: string) => void
  onToggleShowAll: () => void
  onEditRecord: (record: RunningRecord) => void
}

export default function MonthlyRecordList({
  records,
  selectedDate,
  isCurrentMonth,
  deletingId,
  showAllRecords,
  onDeleteRecord,
  onToggleShowAll,
  onEditRecord,
}: MonthlyRecordListProps) {
  const month = selectedDate.getMonth() + 1
  const displayedRecords = showAllRecords ? records : records.slice(0, 5)

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold text-gray-500 tracking-wider">
          {month}월 기록 ({records.length}회)
        </h3>
        <span className="text-[10px] text-gray-400">최신순</span>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 py-8 text-center text-xs text-gray-500">
          {isCurrentMonth ? '아직 이번 달 기록이 없어요. 첫 달리기를 인증해보세요!' : '해당 월 기록 없음'}
        </div>
      ) : (
        <div className="space-y-2">
          {displayedRecords.map((record) => (
            <div
              key={record.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-55 transition-all text-xs"
            >
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                  record.run_type === 'REGULAR'
                    ? 'bg-neon-yellow text-gray-900 border border-neon-yellow/10'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {record.run_type === 'REGULAR' ? '정기' : '개인'}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {parseFloat(String(record.distance_km)).toFixed(1)}
                <span className="text-xs text-gray-400 font-normal"> km</span>
              </span>
              {record.is_pacing && (
                <span className="text-[9px] text-gray-950 bg-gray-250 border border-gray-300 px-1.5 py-0.5 rounded-md font-bold">
                  페이서
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto font-medium mr-1">{record.run_date}</span>
              <button
                onClick={() => onEditRecord(record)}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                aria-label="수정"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => onDeleteRecord(record.id)}
                disabled={deletingId === record.id}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                aria-label="삭제"
              >
                {deletingId === record.id ? (
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          ))}

          {records.length > 5 && (
            <button
              onClick={onToggleShowAll}
              className="w-full py-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-500 hover:text-gray-900 rounded-2xl transition-all active:scale-[0.98] mt-2 text-center"
            >
              {showAllRecords ? '간략히 보기 🔼' : `+${records.length - 5}개 기록 더 보기 (확인/수정) 🔽`}
            </button>
          )}
        </div>
      )}

      {/* 전체 기록 분석 리포트 보기 */}
      <Link
        href="/my-records"
        className="w-full mt-4 py-4 bg-gray-55 border border-gray-200 hover:border-gray-300 text-gray-900 text-xs font-bold rounded-2xl transition-all active:scale-[0.98] active:bg-neon-yellow flex items-center justify-center gap-2"
      >
        <span>나의 전체 기록 분석 리포트 보기</span>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}
