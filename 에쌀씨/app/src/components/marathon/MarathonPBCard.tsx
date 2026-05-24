'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MarathonPBForm from './MarathonPBForm'
import type { Database } from '@/lib/types/database.types'

type MarathonPB = Database['public']['Tables']['marathon_pbs']['Row']
type Category = MarathonPB['category']

interface MarathonPBCardProps {
  userId: string
  initialPBs: MarathonPB[]
}

const CATEGORIES: {
  key: Category
  label: string
  emoji: string
}[] = [
  { key: 'TEN_K', label: '10K', emoji: '🏃' },
  { key: 'HALF', label: '하프', emoji: '🏅' },
  { key: 'FULL', label: '풀', emoji: '🏆' },
]

/** PostgreSQL interval 문자열 '01:45:00' → 'HH:MM:SS' 표시용 파싱 */
function formatRecordTime(raw: string): string {
  const parts = raw.split(':')
  if (parts.length < 3) return raw
  const hh = parts[0].padStart(2, '0')
  const mm = parts[1].padStart(2, '0')
  const ss = parts[2].split('.')[0].padStart(2, '0') // 소수점 제거
  return `${hh}:${mm}:${ss}`
}

/** 날짜 문자열 → 한국어 표시 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}년 ${m}월 ${day}일`
}

export default function MarathonPBCard({
  userId,
  initialPBs,
}: MarathonPBCardProps) {
  const supabase = createClient() as any
  const [pbs, setPbs] = useState<MarathonPB[]>(initialPBs)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  // 폼 모달 상태
  const [formOpen, setFormOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [editRecord, setEditRecord] = useState<MarathonPB | null>(null)

  /** 카테고리로 PB 찾기 */
  const findPB = (category: Category): MarathonPB | undefined =>
    pbs.find((pb) => pb.category === category)

  /** 추가 버튼 */
  const handleAdd = (category: Category) => {
    setEditCategory(category)
    setEditRecord(null)
    setFormOpen(true)
  }

  /** 수정 버튼 */
  const handleEdit = (pb: MarathonPB) => {
    setEditCategory(pb.category)
    setEditRecord(pb)
    setFormOpen(true)
  }

  /** 삭제 버튼 */
  const handleDelete = async (pb: MarathonPB) => {
    if (!confirm(`${CATEGORIES.find((c) => c.key === pb.category)?.label} 기록을 삭제하시겠습니까?`)) return

    setDeletingCategory(pb.category)
    try {
      const { error } = await supabase
        .from('marathon_pbs')
        .delete()
        .eq('id', pb.id)

      if (error) throw error

      // 낙관적 갱신
      setPbs((prev) => prev.filter((p) => p.id !== pb.id))
    } catch (err) {
      console.error('마라톤 PB 삭제 실패:', err)
      alert('기록 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingCategory(null)
    }
  }

  /** 폼 성공 → 최신 PB 전체 재조회 */
  const handleFormSuccess = async () => {
    try {
      const { data, error } = await supabase
        .from('marathon_pbs')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      if (data) setPbs(data)
    } catch (err) {
      console.error('PB 갱신 실패:', err)
    }
    setFormOpen(false)
  }

  return (
    <>
      {/* 섹션 헤더 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            🏅 마라톤 개인 최고기록
          </h3>
        </div>

        {/* 3장 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CATEGORIES.map(({ key, label, emoji }) => {
            const pb = findPB(key)
            const isDeleting = deletingCategory === key

            return (
              <div
                key={key}
                className="
                  group relative overflow-hidden
                  rounded-2xl border border-white/5 bg-gray-900/40
                  backdrop-blur-sm p-5
                  transition-all duration-300
                  hover:bg-gray-900/60 hover:border-white/10
                "
              >
                {/* 카테고리 상단 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-sm font-bold text-gray-300 tracking-tight">
                      {label}
                    </span>
                  </div>

                  {/* 기록 있을 때 액션 버튼 */}
                  {pb && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* 수정 */}
                      <button
                        onClick={() => handleEdit(pb)}
                        className="rounded-lg p-1.5 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        aria-label="기록 수정"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {/* 삭제 */}
                      <button
                        onClick={() => handleDelete(pb)}
                        disabled={isDeleting}
                        className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        aria-label="기록 삭제"
                      >
                        {isDeleting ? (
                          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* 기록 영역 */}
                {pb ? (
                  <div className="space-y-2">
                    {/* PB 타임 - 골드 그라디언트 */}
                    <div className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                      {formatRecordTime(pb.record_time)}
                    </div>

                    {/* 달성일 */}
                    {pb.achieved_at && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(pb.achieved_at)}
                      </p>
                    )}

                    {/* 달성 뱃지 */}
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        ✨ PB 달성
                      </span>
                    </div>
                  </div>
                ) : (
                  /* 기록 없음 */
                  <div className="flex flex-col items-center justify-center py-3 space-y-3">
                    <p className="text-sm text-gray-600">기록 없음</p>
                    <button
                      onClick={() => handleAdd(key)}
                      className="
                        flex items-center justify-center gap-1.5
                        rounded-xl border border-dashed border-white/10
                        bg-white/[0.02] px-4 py-2
                        text-xs font-semibold text-gray-400
                        hover:border-emerald-500/30 hover:text-emerald-400
                        hover:bg-emerald-500/5
                        transition-all duration-200 active:scale-[0.98]
                      "
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      기록 추가
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 폼 모달 */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <MarathonPBForm
            userId={userId}
            category={editCategory}
            existingRecord={editRecord}
            onSuccess={handleFormSuccess}
            onClose={() => setFormOpen(false)}
          />
        </div>
      )}
    </>
  )
}
