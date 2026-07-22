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
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)

  // 폼 모달 상태
  const [formOpen, setFormOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [editRecord, setEditRecord] = useState<MarathonPB | null>(null)

  // 아코디언 상태
  const [expandedCategories, setExpandedCategories] = useState<Record<Category, boolean>>({
    TEN_K: false,
    HALF: false,
    FULL: false,
  })

  const toggleExpand = (category: Category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  // interval 문자열을 초 단위로 변환
  const recordTimeToSeconds = (raw: string): number => {
    const parts = raw.split(':')
    if (parts.length < 3) return 999999
    const h = parseInt(parts[0] || '0', 10)
    const m = parseInt(parts[1] || '0', 10)
    const s = parseInt(parts[2].split('.')[0] || '0', 10)
    return h * 3600 + m * 60 + s
  }

  /** 종목별 가장 빠른 최고기록(PB) 조회 */
  const findPB = (category: Category): MarathonPB | undefined => {
    const categoryRecords = pbs.filter((pb) => pb.category === category)
    if (categoryRecords.length === 0) return undefined
    
    return [...categoryRecords].sort((a, b) => {
      const secA = recordTimeToSeconds(a.record_time)
      const secB = recordTimeToSeconds(b.record_time)
      if (secA !== secB) return secA - secB
      
      const dateA = a.achieved_at ? new Date(a.achieved_at).getTime() : 0
      const dateB = b.achieved_at ? new Date(b.achieved_at).getTime() : 0
      return dateB - dateA // 날짜 최신순
    })[0]
  }

  /** 종목별 모든 기록 조회 (날짜 최신순 정렬) */
  const getCategoryHistory = (category: Category): MarathonPB[] => {
    const categoryRecords = pbs.filter((pb) => pb.category === category)
    return [...categoryRecords].sort((a, b) => {
      const dateA = a.achieved_at ? new Date(a.achieved_at).getTime() : 0
      const dateB = b.achieved_at ? new Date(b.achieved_at).getTime() : 0
      if (dateA !== dateB) return dateB - dateA
      
      const secA = recordTimeToSeconds(a.record_time)
      const secB = recordTimeToSeconds(b.record_time)
      return secA - secB
    })
  }

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

    setDeletingRecordId(pb.id)
    try {
      const { error } = await supabase
        .from('marathon_pbs')
        .delete()
        .eq('id', pb.id)

      if (error) throw error

      // 낙관적 갱신
      setPbs((prev) => prev.filter((p) => p.id !== pb.id))
    } catch (err) {
      console.error('마라톤 기록 삭제 실패:', err)
      alert('기록 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingRecordId(null)
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
      console.error('기록 갱신 실패:', err)
    }
    setFormOpen(false)
  }

  return (
    <>
      {/* 섹션 헤더 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            마라톤 개인 기록 관리
          </h3>
        </div>

        {/* 3장 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CATEGORIES.map(({ key, label, emoji }) => {
            const pb = findPB(key)
            const history = getCategoryHistory(key)

            return (
              <div
                key={key}
                className="
                  group relative overflow-hidden
                  rounded-2xl border border-gray-200 bg-white p-5
                  transition-all duration-300 hover:bg-gray-50
                "
              >
                {/* 카테고리 상단 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-sm font-bold text-gray-900 tracking-tight">
                      {label}
                    </span>
                  </div>

                  {/* 기록 있을 때 추가 버튼 */}
                  {pb && (
                    <button
                      onClick={() => handleAdd(key)}
                      className="rounded-2xl p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      title="새 기록 등록"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 기록 영역 */}
                {pb ? (
                  <div className="space-y-2">
                    {/* PB 타임 - 짙은 텍스트 */}
                    <div className="text-2xl font-bold tracking-tight text-gray-900">
                      {formatRecordTime(pb.record_time)}
                    </div>

                    {/* 달성일 */}
                    {pb.achieved_at && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(pb.achieved_at)}
                      </p>
                    )}

                    {/* 달성 뱃지 */}
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-2 py-0.5 text-[10px] font-bold text-gray-900">
                        최고 기록 (PB)
                      </span>
                    </div>
                  </div>
                ) : (
                  /* 기록 없음 */
                  <div className="flex flex-col items-center justify-center py-3 space-y-3">
                    <p className="text-sm text-gray-400">기록 없음</p>
                    <button
                      onClick={() => handleAdd(key)}
                      className="
                        flex items-center justify-center gap-1.5
                        rounded-2xl border border-dashed border-gray-300
                        bg-gray-50 px-4 py-2
                        text-xs font-bold text-gray-500
                        hover:border-gray-400 hover:text-gray-900
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

                {/* 과거 기록 보기 아코디언 */}
                {history.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => toggleExpand(key)}
                      className="flex items-center justify-between w-full text-left text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <span>과거 기록 보기 ({history.length})</span>
                      <svg
                        className={`h-3.5 w-3.5 transform transition-transform duration-200 ${
                          expandedCategories[key] ? 'rotate-180' : 'rotate-0'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {expandedCategories[key] && (
                      <div className="mt-2.5 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {history.map((hRecord) => {
                          const isBest = hRecord.id === pb?.id
                          const isDeleting = deletingRecordId === hRecord.id
                          
                          return (
                            <div
                              key={hRecord.id}
                              className={`flex items-center justify-between p-2 rounded-2xl border text-[11px] transition-all duration-200 ${
                                isBest
                                  ? 'bg-[#CCFF00]/10 border-[#CCFF00]'
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-mono font-bold text-gray-900`}>
                                    {formatRecordTime(hRecord.record_time)}
                                  </span>
                                  {isBest && (
                                    <span className="bg-[#CCFF00] text-[9px] text-gray-900 border border-[#b8e600] px-1 rounded font-bold">
                                      PB
                                    </span>
                                  )}
                                </div>
                                {hRecord.achieved_at && (
                                  <p className="text-[9px] text-gray-500 font-medium">
                                    {formatDate(hRecord.achieved_at)}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => handleEdit(hRecord)}
                                  className="rounded-2xl p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                  title="수정"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(hRecord)}
                                  disabled={isDeleting}
                                  className="rounded-2xl p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                  title="삭제"
                                >
                                  {isDeleting ? (
                                    <svg className="animate-spin h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24">
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
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 폼 모달 */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
