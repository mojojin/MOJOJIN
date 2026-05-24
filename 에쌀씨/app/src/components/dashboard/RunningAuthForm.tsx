'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RunningAuthFormProps {
  userId: string
  userRole: 'WAITING' | 'REGULAR' | 'PACER' | 'ADMIN'
  onSuccess: () => void
  onClose: () => void
}

interface LocationItem {
  id: string
  name: string
}

export default function RunningAuthForm({
  userId,
  userRole,
  onSuccess,
  onClose,
}: RunningAuthFormProps) {
  const supabase = createClient()

  // 폼 상태
  const [distance, setDistance] = useState<string>('')
  const [locationId, setLocationId] = useState<string>('')
  const [runDate, setRunDate] = useState<string>('')
  const [runType, setRunType] = useState<'PERSONAL' | 'REGULAR'>('PERSONAL')
  const [isPacing, setIsPacing] = useState<boolean>(false)

  // 상태 관리
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 오늘 날짜 계산 (KST 기준 YYYY-MM-DD)
  const getTodayString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 최소 날짜 계산 (30일 전, ADMIN 제외)
  const getMinDateString = () => {
    if (userRole === 'ADMIN') return '' // 무기한 소급 가능
    const today = new Date()
    today.setDate(today.getDate() - 30)
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 장소 데이터 로드
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name')
          .eq('is_active', true)
          .order('name') as { data: LocationItem[] | null; error: any }

        if (error) throw error
        if (data) {
          setLocations(data)
          if (data.length > 0) {
            setLocationId(data[0].id)
          }
        }
      } catch (err) {
        console.error('장소 불러오기 에러:', err)
        setErrorMsg('장소 목록을 불러오지 못했습니다.')
      }
    };

    fetchLocations()
    setRunDate(getTodayString())
  }, [supabase])

  // 거리 빠른 추가 헬퍼
  const handleQuickAddDistance = (val: number) => {
    const current = parseFloat(distance) || 0
    setDistance((current + val).toFixed(1))
  }

  // 폼 검증
  const validateForm = (): boolean => {
    setErrorMsg(null)

    // 1. 거리 검증
    const distNum = parseFloat(distance)
    if (isNaN(distNum)) {
      setErrorMsg('거리를 올바른 숫자로 입력해 주세요.')
      return false
    }
    if (distNum < 3.0) {
      setErrorMsg('러닝 최소 인증 거리는 3.0km 이상입니다.')
      return false
    }

    // 2. 장소 검증
    if (!locationId) {
      setErrorMsg('러닝 장소를 선택해 주세요.')
      return false
    }

    // 3. 날짜 검증
    if (!runDate) {
      setErrorMsg('러닝 날짜를 입력해 주세요.')
      return false
    }

    const todayStr = getTodayString()
    if (runDate > todayStr) {
      setErrorMsg('미래의 날짜는 선택할 수 없습니다.')
      return false
    }

    if (userRole !== 'ADMIN') {
      const minDateStr = getMinDateString()
      if (runDate < minDateStr) {
        setErrorMsg('일반 회원은 최근 30일 이내의 기록만 입력 가능합니다.')
        return false
      }
    }

    return true
  }

  // 전송 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setErrorMsg(null)

    try {
      const selectedLoc = locations.find((l) => l.id === locationId)
      if (!selectedLoc) {
        throw new Error('선택된 장소가 올바르지 않습니다.')
      }

      const distNum = parseFloat(distance)

      // Supabase INSERT 실행
      const { error } = await supabase.from('running_records').insert({
        user_id: userId,
        run_date: runDate,
        distance_km: distNum,
        location_id: locationId,
        location_name_snapshot: selectedLoc.name,
        run_type: runType,
        is_pacing: isPacing,
      } as any)

      if (error) throw error

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('러닝 인증 저장 에러:', err)
      setErrorMsg(err.message || '인증 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-900/90 p-6 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-xl font-bold text-white">🏃 러닝 기록 인증하기</h3>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm font-semibold text-red-400">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 거리 입력 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            러닝 거리 (km) <span className="text-amber-500">*</span>
          </label>
          <div className="relative rounded-2xl bg-black/30 border border-white/10 focus-within:border-emerald-500/50 transition-colors">
            <input
              type="number"
              step="0.1"
              min="3.0"
              required
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent px-4 py-3.5 text-lg font-bold text-white outline-none placeholder-gray-600"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
              KM
            </span>
          </div>
          {/* 빠른 입력 버튼 */}
          <div className="flex gap-1.5 pt-1">
            {[3.0, 5.0, 10.0].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setDistance(val.toFixed(1))}
                className="rounded-lg bg-white/5 border border-white/5 px-3 py-1 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                {val}k
              </button>
            ))}
            <div className="h-4 w-[1px] bg-white/10 mx-1 align-middle my-auto" />
            {['+1', '+5'].map((label) => {
              const val = parseInt(label)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleQuickAddDistance(val)}
                  className="rounded-lg bg-white/5 border border-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 장소 선택 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            러닝 장소 <span className="text-amber-500">*</span>
          </label>
          <div className="relative rounded-2xl bg-black/30 border border-white/10 focus-within:border-emerald-500/50 transition-colors">
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-transparent px-4 py-3.5 text-sm font-medium text-white outline-none appearance-none cursor-pointer"
            >
              {locations.map((loc) => (
                <option
                  key={loc.id}
                  value={loc.id}
                  className="bg-gray-950 text-white"
                >
                  {loc.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 날짜 선택 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            러닝 날짜 <span className="text-amber-500">*</span>
          </label>
          <div className="relative rounded-2xl bg-black/30 border border-white/10 focus-within:border-emerald-500/50 transition-colors">
            <input
              type="date"
              required
              value={runDate}
              max={getTodayString()}
              min={getMinDateString()}
              onChange={(e) => setRunDate(e.target.value)}
              className="w-full bg-transparent px-4 py-3.5 text-sm font-medium text-white outline-none [color-scheme:dark] cursor-pointer"
            />
          </div>
          {userRole !== 'ADMIN' && (
            <p className="text-[11px] text-gray-500">
              오늘 기준 최근 30일 이내의 날짜만 선택 가능합니다.
            </p>
          )}
        </div>

        {/* 인증 종류 선택 (개인런 / 벙) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">인증 종류</label>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/20 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setRunType('PERSONAL')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                runType === 'PERSONAL'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏃 개인런
            </button>
            <button
              type="button"
              onClick={() => setRunType('REGULAR')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                runType === 'REGULAR'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🎉 벙 (정기런)
            </button>
          </div>
        </div>

        {/* 페이싱 유무 (페이스메이커) */}
        <div className="flex items-center justify-between rounded-2xl bg-white/[0.02] border border-white/5 p-4">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-white">페이스메이커 활동 🎈</span>
            <p className="text-[11px] text-gray-500">
              기록 인증 내역에 페이서 배지가 표기됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPacing(!isPacing)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
              isPacing ? 'bg-emerald-500' : 'bg-gray-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isPacing ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="
            relative overflow-hidden w-full py-4 rounded-2xl
            bg-gradient-to-r from-emerald-500 to-teal-400
            text-black font-extrabold text-[15px] tracking-wide
            hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]
            disabled:opacity-50 transition-all duration-300
            active:scale-[0.98] mt-2
          "
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-black"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              기록 전송 중...
            </span>
          ) : (
            '기록 저장 완료하기'
          )}
        </button>
      </form>
    </div>
  )
}
