'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type MarathonPB = Database['public']['Tables']['marathon_pbs']['Row']
type Category = MarathonPB['category']

interface MarathonPBFormProps {
  userId: string
  category: Category | null
  existingRecord: MarathonPB | null
  onSuccess: () => void
  onClose: () => void
}

const CATEGORY_OPTIONS: {
  key: Category
  label: string
  emoji: string
  desc: string
}[] = [
  { key: 'TEN_K', label: '10K', emoji: '🏃', desc: '10킬로미터' },
  { key: 'HALF', label: '하프', emoji: '🏅', desc: '하프 마라톤 (21.0975km)' },
  { key: 'FULL', label: '풀', emoji: '🏆', desc: '풀 마라톤 (42.195km)' },
]

/** 시간 문자열 파싱: '01:45:30' → { hours: 1, minutes: 45, seconds: 30 } */
function parseRecordTime(raw: string): {
  hours: number
  minutes: number
  seconds: number
} {
  const parts = raw.split(':')
  return {
    hours: parseInt(parts[0] || '0', 10),
    minutes: parseInt(parts[1] || '0', 10),
    seconds: parseInt((parts[2] || '0').split('.')[0], 10),
  }
}

export default function MarathonPBForm({
  userId,
  category: categoryProp,
  existingRecord,
  onSuccess,
  onClose,
}: MarathonPBFormProps) {
  const supabase = createClient() as any

  // 상태
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    categoryProp
  )
  const [hours, setHours] = useState<string>('')
  const [minutes, setMinutes] = useState<string>('')
  const [seconds, setSeconds] = useState<string>('')
  const [achievedAt, setAchievedAt] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 모바일 스크롤 및 당겨서 새로고침(Pull-to-refresh) 차단
  useEffect(() => {
    const originalOverflow = document.documentElement.style.overflow
    const originalOverscroll = document.documentElement.style.overscrollBehavior
    const originalBodyOverflow = document.body.style.overflow
    const originalBodyOverscroll = document.body.style.overscrollBehavior

    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.documentElement.style.overflow = originalOverflow
      document.documentElement.style.overscrollBehavior = originalOverscroll
      document.body.style.overflow = originalBodyOverflow
      document.body.style.overscrollBehavior = originalBodyOverscroll
    }
  }, [])

  // 기존 기록이 있을 경우 초기화
  useEffect(() => {
    if (existingRecord) {
      const parsed = parseRecordTime(existingRecord.record_time)
      setHours(String(parsed.hours))
      setMinutes(String(parsed.minutes))
      setSeconds(String(parsed.seconds))
      if (existingRecord.achieved_at) {
        // achieved_at을 YYYY-MM-DD로 정리
        setAchievedAt(existingRecord.achieved_at.slice(0, 10))
      }
    }
  }, [existingRecord])

  /** 입력값 검증 */
  const validate = (): boolean => {
    if (!selectedCategory) {
      setError('종목을 선택해주세요.')
      return false
    }

    const h = parseInt(hours || '0', 10)
    const m = parseInt(minutes || '0', 10)
    const s = parseInt(seconds || '0', 10)

    if (isNaN(h) || h < 0 || h > 23) {
      setError('시간은 0~23 사이여야 합니다.')
      return false
    }
    if (isNaN(m) || m < 0 || m > 59) {
      setError('분은 0~59 사이여야 합니다.')
      return false
    }
    if (isNaN(s) || s < 0 || s > 59) {
      setError('초는 0~59 사이여야 합니다.')
      return false
    }
    if (h === 0 && m === 0 && s === 0) {
      setError('기록 시간을 입력해주세요.')
      return false
    }

    setError(null)
    return true
  }

  /** 제출 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const hh = String(parseInt(hours || '0', 10)).padStart(2, '0')
      const mm = String(parseInt(minutes || '0', 10)).padStart(2, '0')
      const ss = String(parseInt(seconds || '0', 10)).padStart(2, '0')
      const record_time = `${hh}:${mm}:${ss}`

      if (existingRecord) {
        // 수정 모드: ID 기준 UPDATE
        const { error: updateError } = await supabase
          .from('marathon_pbs')
          .update({
            category: selectedCategory!,
            record_time,
            achieved_at: achievedAt || null,
          })
          .eq('id', existingRecord.id)

        if (updateError) throw updateError
      } else {
        // 추가 모드: INSERT
        const { error: insertError } = await supabase
          .from('marathon_pbs')
          .insert({
            user_id: userId,
            category: selectedCategory!,
            record_time,
            achieved_at: achievedAt || null,
          })

        if (insertError) throw insertError
      }

      onSuccess()
    } catch (err) {
      console.error('마라톤 PB 저장 실패:', err)
      setError('기록 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /** 숫자 입력 필드 공통 핸들러 */
  const handleNumberInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    max: number
  ) => {
    // 빈 문자열 허용
    if (value === '') {
      setter('')
      return
    }
    // 숫자만 허용
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0 && num <= max) {
      setter(String(num))
    }
  }

  const isEditing = existingRecord !== null
  const showCategorySelector = categoryProp === null

  return (
    <div
      className="
        relative w-full max-w-md
        rounded-2xl border border-gray-200 bg-white shadow-xl
        p-6 space-y-6
        animate-in slide-in-from-bottom-4 duration-300
      "
    >
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-2xl p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="닫기"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 헤더 */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          {isEditing ? '기록 수정' : '마라톤 PB 등록'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {isEditing
            ? '마라톤 개인 최고기록을 수정합니다.'
            : '새로운 마라톤 개인 최고기록을 등록합니다.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 종목 선택 */}
        {showCategorySelector && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              종목 선택
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map(({ key, label, emoji, desc }) => {
                const isSelected = selectedCategory === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(key)
                      setError(null)
                    }}
                    className={`
                      flex flex-col items-center gap-1.5
                      rounded-2xl border p-3
                      transition-all duration-200 active:scale-[0.98]
                      ${
                        isSelected
                          ? 'border-[#b8e600] bg-[#CCFF00] text-gray-900 shadow-sm'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100'
                      }
                    `}
                    title={desc}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 선택된 종목 표시 */}
        {!showCategorySelector && selectedCategory && (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-xl">
              {CATEGORY_OPTIONS.find((c) => c.key === selectedCategory)?.emoji}
            </span>
            <div>
              <span className="text-sm font-bold text-gray-900">
                {CATEGORY_OPTIONS.find((c) => c.key === selectedCategory)?.label}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {CATEGORY_OPTIONS.find((c) => c.key === selectedCategory)?.desc}
              </span>
            </div>
          </div>
        )}

        {/* 기록 시간 입력 */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            기록 시간
          </label>
          <div className="grid grid-cols-3 gap-3">
            {/* 시 */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 text-center block font-bold">시간</label>
              <input
                type="number"
                min={0}
                max={23}
                value={hours}
                onChange={(e) => handleNumberInput(e.target.value, setHours, 23)}
                placeholder="0"
                className="
                  w-full rounded-2xl border border-gray-200 bg-white
                  px-3 py-3 text-center text-xl font-extrabold text-gray-900
                  placeholder-gray-300
                  focus:border-gray-450 focus:ring-1 focus:ring-gray-200
                  focus:outline-none transition-colors
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
            </div>
            {/* 분 */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 text-center block font-bold">분</label>
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => handleNumberInput(e.target.value, setMinutes, 59)}
                placeholder="00"
                className="
                  w-full rounded-2xl border border-gray-200 bg-white
                  px-3 py-3 text-center text-xl font-extrabold text-gray-900
                  placeholder-gray-300
                  focus:border-gray-450 focus:ring-1 focus:ring-gray-200
                  focus:outline-none transition-colors
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
            </div>
            {/* 초 */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 text-center block font-bold">초</label>
              <input
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(e) => handleNumberInput(e.target.value, setSeconds, 59)}
                placeholder="00"
                className="
                  w-full rounded-2xl border border-gray-200 bg-white
                  px-3 py-3 text-center text-xl font-extrabold text-gray-900
                  placeholder-gray-300
                  focus:border-gray-450 focus:ring-1 focus:ring-gray-200
                  focus:outline-none transition-colors
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
            </div>
          </div>
          {/* 타임 미리보기 */}
          <div className="text-center pt-1">
            <span className="text-xs text-gray-450">
              미리보기:{' '}
              <span className="font-mono text-gray-600 font-bold">
                {String(parseInt(hours || '0', 10)).padStart(2, '0')}:
                {String(parseInt(minutes || '0', 10)).padStart(2, '0')}:
                {String(parseInt(seconds || '0', 10)).padStart(2, '0')}
              </span>
            </span>
          </div>
        </div>

        {/* 달성일 */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            달성일 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <input
            type="date"
            value={achievedAt}
            onChange={(e) => setAchievedAt(e.target.value)}
            className="
              w-full rounded-2xl border border-gray-200 bg-white
              px-4 py-3 text-sm text-gray-900
              focus:border-gray-400 focus:outline-none transition-colors
            "
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 font-bold">
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            w-full py-3.5 rounded-2xl
            bg-[#CCFF00] border border-[#b8e600]
            text-gray-900 font-bold text-sm tracking-wide
            flex items-center justify-center gap-2
            transition-all duration-300 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-gray-900" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              저장 중...
            </>
          ) : (
            <>
              <span>{isEditing ? '기록 수정하기' : 'PB 등록하기'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
