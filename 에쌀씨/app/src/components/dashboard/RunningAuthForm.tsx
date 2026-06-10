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
  address?: string | null
  parking_info?: string | null
  map_url?: string | null
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
  const [customLocationName, setCustomLocationName] = useState<string>('')

  // 상태 관리
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [kakaoText, setKakaoText] = useState<string>('')

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
          .select('id, name, address, parking_info, map_url')
          .eq('is_active', true)
          .order('name') as { data: LocationItem[] | null; error: any }

        if (error) throw error
        
        const fetchedLocations = data || []
        const locationsWithOther = [...fetchedLocations, { id: 'OTHER', name: '기타 (직접 입력)' }]
        
        setLocations(locationsWithOther)
        if (locationsWithOther.length > 0) {
          setLocationId(locationsWithOther[0].id)
        }
      } catch (err) {
        console.error('장소 불러오기 에러:', err)
        setErrorMsg('장소 목록을 불러오지 못했습니다.')
      }
    };

    fetchLocations()
    setRunDate(getTodayString())
  }, [supabase])

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

  // 거리 빠른 추가 헬퍼
  const handleQuickAddDistance = (val: number) => {
    const current = parseFloat(distance) || 0
    const nextVal = current + val
    if (nextVal > 0) {
      setDistance(nextVal.toFixed(1))
    } else {
      setDistance('')
    }
  }

  // 실시간 유효성 계산
  const distNum = parseFloat(distance)
  const isDistanceInvalid = distance !== '' && (isNaN(distNum) || distNum < 3.0)

  const todayStr = getTodayString()
  const minDateStr = getMinDateString()
  const isFutureDate = runDate !== '' && runDate > todayStr
  const isPastLimitDate = runDate !== '' && userRole !== 'ADMIN' && runDate < minDateStr
  const isDateInvalid = isFutureDate || isPastLimitDate

  // 폼 검증
  const validateForm = (): boolean => {
    setErrorMsg(null)

    // 1. 거리 검증
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
    if (locationId === 'OTHER' && !customLocationName.trim()) {
      setErrorMsg('기타 장소의 이름을 입력해 주세요.')
      return false
    }

    // 3. 날짜 검증
    if (!runDate) {
      setErrorMsg('러닝 날짜를 입력해 주세요.')
      return false
    }

    if (runDate > todayStr) {
      setErrorMsg('미래의 날짜는 선택할 수 없습니다.')
      return false
    }

    if (userRole !== 'ADMIN') {
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

      const finalLocationId = locationId === 'OTHER' ? null : locationId
      const finalLocationName = locationId === 'OTHER' ? customLocationName.trim() : selectedLoc.name

      // Supabase INSERT 실행
      const { error } = await supabase.from('running_records').insert({
        user_id: userId,
        run_date: runDate,
        distance_km: distNum,
        location_id: finalLocationId,
        location_name_snapshot: finalLocationName,
        run_type: runType,
        is_pacing: isPacing,
      } as any)

      if (error) throw error

      // 카카오톡 공유 텍스트 생성
      const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', userId).single()
      const nickname = profile?.nickname || '러너'
      
      const shareText = `🏃 SRC 오늘의 러닝 인증!
👤 러너: ${nickname}
🗓 날짜: ${runDate.replace(/-/g, '.')}
📍 장소: ${finalLocationName}
🔥 거리: ${distNum}km

"오늘도 에쌀씨와 함께 즐겁게 달렸습니다! 🏃‍♂️💨"
망설이고 계시다면 신발끈을 묶고 일단 나와보세요! 함께 뛸 사람 언제든 환영합니다! 🙌`
      
      setKakaoText(shareText)
      setIsSuccess(true)
      onSuccess()
    } catch (err: any) {
      console.error('러닝 인증 저장 에러:', err)
      setErrorMsg(err.message || '인증 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(kakaoText)
      alert('인증 양식이 복사되었습니다!\n카카오톡 대화방에 붙여넣기 해주세요. 🚀')
    } catch (err) {
      alert('복사에 실패했습니다. 아래 텍스트를 직접 복사해 주세요.')
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-gray-900/90 p-8 backdrop-blur-2xl shadow-2xl text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-white mb-2">인증 완료!</h2>
        <p className="text-sm text-gray-400 mb-6">오늘도 달린 당신, 정말 멋집니다 👍</p>
        
        <div className="bg-black/50 border border-white/10 rounded-2xl p-4 mb-6 text-left relative group">
          <pre className="text-xs text-emerald-400 whitespace-pre-wrap font-mono leading-relaxed">{kakaoText}</pre>
        </div>

        <button
          onClick={copyToClipboard}
          className="w-full py-4 mb-3 rounded-2xl bg-[#FEE500] text-[#191919] font-extrabold text-[15px] flex items-center justify-center gap-2 hover:bg-[#FEE500]/90 transition-colors shadow-lg"
        >
          <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current"><path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10 0 3.52 2.24 6.64 5.6 8.48l-1.44 5.28c-.08.4.32.72.72.48l6.16-4.08c.56.08 1.12.16 1.68.16 6.96 0 12.64-4.48 12.64-10s-5.68-10-12.72-10z"/></svg>
          카톡방에 인증 내역 자랑하기
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 transition-colors"
        >
          닫기
        </button>
      </div>
    )
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
          <div className={`relative rounded-2xl bg-black/30 border transition-colors ${
            isDistanceInvalid
              ? 'border-red-500/80 focus-within:border-red-500'
              : 'border-white/10 focus-within:border-emerald-500/50'
          }`}>
            <input
              type="text"
              inputMode="decimal"
              required
              value={distance}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || /^\d*\.?\d{0,1}$/.test(val)) {
                  setDistance(val)
                }
              }}
              placeholder="0.0"
              className="w-full bg-transparent px-4 py-3.5 text-lg font-bold text-white outline-none placeholder-gray-600"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
              KM
            </span>
          </div>
          {isDistanceInvalid && (
            <p className="text-xs text-red-400 font-semibold mt-1">
              ⚠️ 러닝 최소 인증 거리는 3.0km 이상입니다.
            </p>
          )}
          {/* 빠른 입력 버튼 */}
          <div className="flex flex-wrap gap-1.5 pt-1">
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
            {['+1', '+5', '-1', '-5'].map((label) => {
              const val = parseInt(label)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleQuickAddDistance(val)}
                  className={`rounded-lg bg-white/5 border border-white/5 px-2.5 py-1 text-xs font-semibold ${
                    val > 0 ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'
                  } transition-colors`}
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
          
          {/* 기타 입력 폼 */}
          {locationId === 'OTHER' && (
            <div className="mt-2 relative rounded-2xl bg-black/30 border border-white/10 focus-within:border-emerald-500/50 transition-colors">
              <input
                type="text"
                placeholder="예) 올림픽공원, 광교호수공원 등"
                value={customLocationName}
                onChange={(e) => setCustomLocationName(e.target.value)}
                className="w-full bg-transparent px-4 py-3.5 text-sm font-medium text-white outline-none placeholder-gray-600"
              />
            </div>
          )}

          {/* 장소 상세 정보 표시 */}
          {(() => {
            const selectedLoc = locations.find((l) => l.id === locationId)
            if (!selectedLoc) return null
            if (!selectedLoc.address && !selectedLoc.parking_info && !selectedLoc.map_url) return null

            return (
              <div className="mt-2 rounded-xl bg-black/20 border border-white/5 p-3 text-xs text-gray-400 space-y-1">
                {selectedLoc.address && (
                  <p className="flex items-start gap-1.5">
                    <span className="shrink-0">📍</span>
                    <span>{selectedLoc.address}</span>
                  </p>
                )}
                {selectedLoc.parking_info && (
                  <p className="flex items-start gap-1.5">
                    <span className="shrink-0">🚗</span>
                    <span>{selectedLoc.parking_info}</span>
                  </p>
                )}
                {selectedLoc.map_url && (
                  <p className="flex items-start gap-1.5 pt-1">
                    <span className="shrink-0">🔗</span>
                    <a href={selectedLoc.map_url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline font-medium">
                      카카오맵 열기
                    </a>
                  </p>
                )}
              </div>
            )
          })()}
        </div>

        {/* 날짜 선택 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            러닝 날짜 <span className="text-amber-500">*</span>
          </label>
          <div className={`relative rounded-2xl bg-black/30 border transition-colors ${
            isDateInvalid
              ? 'border-red-500/80 focus-within:border-red-500'
              : 'border-white/10 focus-within:border-emerald-500/50'
          }`}>
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
          {isFutureDate && (
            <p className="text-xs text-red-400 font-semibold mt-1">
              ⚠️ 미래의 날짜는 선택할 수 없습니다.
            </p>
          )}
          {isPastLimitDate && (
            <p className="text-xs text-red-400 font-semibold mt-1">
              ⚠️ 일반 회원은 최근 30일 이내의 기록만 입력 가능합니다. (기준일: {minDateStr})
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
