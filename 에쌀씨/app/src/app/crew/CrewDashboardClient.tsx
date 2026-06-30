'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calculateSurvival } from '@/utils/survival'
import type { Database } from '@/lib/types/database.types'
import FrogIcon from '@/components/dashboard/FrogIcon'

type Profile = Database['public']['Tables']['profiles']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface CrewMemberData {
  profile: Profile
  survivalProgress: number
  isSurvived: boolean
  statusText: string
  totalDistance: number
}

interface CrewDashboardClientProps {
  userId: string
  userRole: Profile['role']
}

export default function CrewDashboardClient({ userId, userRole }: CrewDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [crewData, setCrewData] = useState<CrewMemberData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLevelGuideOpen, setIsLevelGuideOpen] = useState(false)

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN_PACER' | 'REGULAR'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  // 이번 달 1일 ~ 말일
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  // 검색/필터 변경시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter])

  const filteredCrew = React.useMemo(() => {
    return crewData.filter(item => {
      const matchesSearch = item.profile.nickname.toLowerCase().includes(searchTerm.toLowerCase())
      let matchesRole = true
      if (roleFilter === 'ADMIN_PACER') {
        matchesRole = item.profile.role === 'ADMIN' || item.profile.role === 'PACER'
      } else if (roleFilter === 'REGULAR') {
        matchesRole = item.profile.role === 'REGULAR'
      }
      return matchesSearch && matchesRole
    })
  }, [crewData, searchTerm, roleFilter])

  const ITEMS_PER_PAGE = 15
  const totalPages = Math.ceil(filteredCrew.length / ITEMS_PER_PAGE)
  const paginatedCrew = filteredCrew.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const isCurrentMonth = 
    selectedDate.getFullYear() === new Date().getFullYear() && 
    selectedDate.getMonth() === new Date().getMonth()

  const fetchCrewData = async (targetDate: Date) => {
    setIsLoading(true)
    try {
      // 1. 모든 활성 정회원 이상 조회
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['REGULAR', 'PACER', 'ADMIN'])
        .eq('is_active', true)
        .order('role', { ascending: false }) // ADMIN(A), PACER(P), REGULAR(R)
        .order('nickname')

      if (profileError) throw profileError
      const profiles = profilesData as Profile[] | null
      if (!profiles) return

      // 2. 해당 월의 러닝 기록 모두 조회
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)

      const formatDate = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }

      const { data: recordsData, error: recordError } = await supabase
        .from('running_records')
        .select('*')
        .gte('run_date', formatDate(startOfMonth))
        .lte('run_date', formatDate(endOfMonth))

      if (recordError) throw recordError
      const records = recordsData as RunningRecord[] | null

      // 3. 누적 전체 기록 (전체 기간 누적 거리용)
      const { data: allRecordsData, error: allRecordError } = await supabase
        .from('running_records')
        .select('user_id, distance_km')
        
      if (allRecordError) throw allRecordError
      const allRecords = allRecordsData as Partial<RunningRecord>[] | null

      // 4. 데이터 조립
      const processedData: CrewMemberData[] = profiles.map(profile => {
        // 이 사람의 이번 달 기록
        const userRecords = records?.filter(r => r.user_id === profile.id) || []
        
        // 이 사람의 전체 기간 기록
        const userAllRecords = allRecords?.filter(r => r.user_id === profile.id) || []
        const totalDistance = userAllRecords.reduce((sum, r) => sum + Number(r.distance_km), 0)

        // 생존 계산
        const survival = calculateSurvival(userRecords, profile.is_exempted)

        return {
          profile,
          survivalProgress: survival.progressPercent,
          isSurvived: survival.isSurvived,
          statusText: survival.statusText,
          totalDistance
        }
      })

      // 누적 거리순 정렬 (혹은 롤/이름순 유지). 일단 누적거리 순으로 정렬해보자
      processedData.sort((a, b) => b.totalDistance - a.totalDistance)

      setCrewData(processedData)
    } catch (err) {
      console.error('크루 데이터 조회 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCrewData(selectedDate)
  }, [selectedDate])

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <span className="text-red-600 font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-2xl text-[10px]">운영자</span>
      case 'PACER': return <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-2xl text-[10px]">페이서</span>
      case 'REGULAR': return <span className="text-blue-600 font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-2xl text-[10px]">정회원</span>
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 text-gray-900 pb-24">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-2xl bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 group">
              <svg className="w-5 h-5 transition-transform group-active:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">크루 현황판</h1>
              <p className="text-xs text-gray-500 mt-0.5">다른 러너들의 열정을 확인해보세요!</p>
            </div>
          </div>
        </div>

        {/* 월 선택 */}
        <div className="flex items-center justify-between px-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-lg font-bold text-gray-900">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
          </h2>

          <button 
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className={`p-2 rounded-full transition-colors active:scale-95 ${
              isCurrentMonth 
                ? 'text-gray-200 cursor-not-allowed' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 검색 및 역할 필터 */}
        <div className="space-y-3 bg-gray-50 border border-gray-150 p-4 rounded-2xl">
          {/* 검색창 */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="닉네임으로 검색..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            />
            <svg className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-650 text-[10px] font-bold"
              >
                초기화
              </button>
            )}
          </div>

          {/* 역할 필터 탭 */}
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-150">
            {(['ALL', 'ADMIN_PACER', 'REGULAR'] as const).map(f => {
              const label = f === 'ALL' ? '전체' : f === 'ADMIN_PACER' ? '운영진/페이서' : '정회원'
              return (
                <button
                  key={f}
                  onClick={() => setRoleFilter(f)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    roleFilter === f
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 크루 리스트 */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-[#CCFF00]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedCrew.map((data, index) => {
              const isMe = data.profile.id === userId
              const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
              return (
                <div 
                  key={data.profile.id}
                  className={`
                    relative p-4 rounded-2xl border transition-all active:scale-[0.99]
                    ${isMe 
                      ? 'bg-[#CCFF00]/10 border-[#CCFF00]' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-400 w-5">{globalIndex}</span>
                      <button
                        onClick={() => setIsLevelGuideOpen(true)}
                        className="transition-transform active:scale-90 flex items-center hover:brightness-110"
                        title="등급표 보기"
                      >
                        <FrogIcon km={data.totalDistance} size="sm" />
                      </button>
                      <span className="text-base font-bold text-gray-900 tracking-tight">{data.profile.nickname}</span>
                      {getRoleBadge(data.profile.role)}
                      {isMe && <span className="bg-gray-200 text-gray-800 text-[9px] px-1.5 py-0.5 rounded-full ml-1">ME</span>}
                    </div>
                    
                    {/* 상태 메모 */}
                    {data.profile.status_text && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-55 border border-amber-200 px-2 py-0.5 rounded-2xl">
                        {data.profile.status_text}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-end">
                    {/* 생존 프로그레스 */}
                    <div className="flex-1 mr-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">이번 달 생존 현황</span>
                        <span className={data.isSurvived || data.profile.is_exempted ? 'text-gray-900 font-bold' : 'text-gray-400'}>
                          {data.statusText}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            data.profile.is_exempted ? 'bg-blue-400' :
                            data.survivalProgress >= 100 ? 'bg-[#CCFF00]' : 'bg-[#CCFF00]/40'
                          }`}
                          style={{ width: `${data.profile.is_exempted ? 100 : data.survivalProgress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* 누적 거리 */}
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">누적 러닝 거리</p>
                      <p className="text-lg font-black text-gray-900">
                        {parseFloat(String(data.totalDistance)).toFixed(1)} <span className="text-xs text-gray-500 font-bold tracking-normal">km</span>
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  이전
                </button>
                <span className="text-xs text-gray-500 font-bold">
                  {currentPage} / {totalPages} 페이지 (총 {filteredCrew.length}명)
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
        {/* 개구리 등급 가이드 모달 */}
        {(() => {
          const myTotalDistance = crewData.find(d => d.profile.id === userId)?.totalDistance || 0
          return isLevelGuideOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setIsLevelGuideOpen(false)}>
              <div 
                className="w-full max-w-sm rounded-2xl bg-white border border-gray-200 p-6 space-y-4 shadow-xl relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      개구리 등급 가이드
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">누적 달리기 거리에 따라 개구리 색상이 변화합니다!</p>
                  </div>
                  <button 
                    onClick={() => setIsLevelGuideOpen(false)}
                    className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* List */}
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {[
                    { label: '동메달 개구리 🥉', range: '0 ~ 300km', km: 150 },
                    { label: '은메달 개구리 🥈', range: '300 ~ 600km', km: 450 },
                    { label: '금메달 개구리 🥇', range: '600 ~ 1,000km', km: 800 },
                    { label: '동트로피 개구리 🥉🏆', range: '1,000 ~ 1,600km', km: 1300 },
                    { label: '은트로피 개구리 🥈🏆', range: '1,600 ~ 2,300km', km: 1950 },
                    { label: '금트로피 개구리 🥇🏆', range: '2,300 ~ 3,000km', km: 2650 },
                    { label: '동비행기 개구리 🛩️', range: '3,000 ~ 4,000km', km: 3500 },
                    { label: '은비행기 개구리 ✈️', range: '4,000 ~ 5,500km', km: 4750 },
                    { label: '금비행기 개구리 🚀', range: '5,500km 이상', km: 6000 },
                  ].map((item, idx) => {
                    const isCurrent = idx === 0 ? myTotalDistance < 300 :
                                      idx === 1 ? myTotalDistance >= 300 && myTotalDistance < 600 :
                                      idx === 2 ? myTotalDistance >= 600 && myTotalDistance < 1000 :
                                      idx === 3 ? myTotalDistance >= 1000 && myTotalDistance < 1600 :
                                      idx === 4 ? myTotalDistance >= 1600 && myTotalDistance < 2300 :
                                      idx === 5 ? myTotalDistance >= 2300 && myTotalDistance < 3000 :
                                      idx === 6 ? myTotalDistance >= 3000 && myTotalDistance < 4000 :
                                      idx === 7 ? myTotalDistance >= 4000 && myTotalDistance < 5500 :
                                      myTotalDistance >= 5500;
                    
                    return (
                      <div 
                        key={item.label}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isCurrent 
                            ? 'bg-[#CCFF00]/10 border-[#CCFF00]' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FrogIcon km={item.km} size="sm" />
                          <div>
                            <p className={`text-xs font-bold ${isCurrent ? 'text-gray-900' : 'text-gray-700'}`}>
                              {item.label}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{item.range}</p>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-[9px] bg-[#CCFF00] border border-[#b8e600] text-gray-900 font-extrabold px-1.5 py-0.5 rounded-2xl">
                            나의 등급
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Bottom info */}
                <div className="pt-2 text-center">
                  <button 
                    onClick={() => setIsLevelGuideOpen(false)}
                    className="w-full py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold transition-all border border-gray-200"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
