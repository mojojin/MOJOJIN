'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calculateSurvival } from '@/utils/survival'
import { getKstDate, getKstMonthStr, formatKstYMD } from '@/utils/date'
import SurvivalProgress from './SurvivalProgress'
import RunningAuthForm from './RunningAuthForm'
import ProfileEditForm from './ProfileEditForm'
import ExpenseClaimForm from './ExpenseClaimForm'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import MigrationPrompt from './MigrationPrompt'
import type { Database } from '@/lib/types/database.types'
import FrogIcon from './FrogIcon'
import RankingBoard from './RankingBoard'
import MonthlyRecordList from './MonthlyRecordList'
import QuickAccessGrid from './QuickAccessGrid'
import DuesStatusBanner from './DuesStatusBanner'

type Profile = Database['public']['Tables']['profiles']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

type DuesRow = Database['public']['Tables']['dues']['Row']

interface DashboardClientProps {
  userId: string
  initialProfile: Profile
  initialRecords: RunningRecord[]
  initialDues?: DuesRow | null
  totalDistanceKm?: number
}

// 누적거리 기반 개구리 등급 시스템
function getDistanceLevel(km: number) {
  if (km < 300) return {
    emoji: '🐸', label: '동메달 개구리', sub: `${km.toFixed(0)} / 300km`,
    color: 'text-orange-600', borderColor: 'border-orange-200',
    bg: 'bg-orange-50',
    bar: 'bg-orange-500',
    glow: '',
    glowColor: '#f97316',
    prevKm: 0, nextKm: 300, pulse: false
  }
  if (km < 600) return {
    emoji: '🐸', label: '은메달 개구리', sub: `${km.toFixed(0)} / 600km`,
    color: 'text-gray-600', borderColor: 'border-gray-200',
    bg: 'bg-gray-50',
    bar: 'bg-gray-400',
    glow: '',
    glowColor: '#9ca3af',
    prevKm: 300, nextKm: 600, pulse: false
  }
  if (km < 1000) return {
    emoji: '🐸', label: '금메달 개구리', sub: `${km.toFixed(0)} / 1,000km`,
    color: 'text-yellow-600', borderColor: 'border-yellow-200',
    bg: 'bg-yellow-50',
    bar: 'bg-yellow-400',
    glow: '',
    glowColor: '#facc15',
    prevKm: 600, nextKm: 1000, pulse: false
  }
  if (km < 1600) return {
    emoji: '🐸', label: '동트로피 개구리', sub: `${km.toFixed(0)} / 1,600km`,
    color: 'text-orange-700', borderColor: 'border-orange-300',
    bg: 'bg-orange-100',
    bar: 'bg-orange-600',
    glow: '',
    glowColor: '#c2410c',
    prevKm: 1000, nextKm: 1600, pulse: false
  }
  if (km < 2300) return {
    emoji: '🐸', label: '은트로피 개구리', sub: `${km.toFixed(0)} / 2,300km`,
    color: 'text-gray-700', borderColor: 'border-gray-300',
    bg: 'bg-gray-100',
    bar: 'bg-gray-500',
    glow: '',
    glowColor: '#6b7280',
    prevKm: 1600, nextKm: 2300, pulse: false
  }
  if (km < 3000) return {
    emoji: '🐸', label: '금트로피 개구리', sub: `${km.toFixed(0)} / 3,000km`,
    color: 'text-yellow-700', borderColor: 'border-yellow-300',
    bg: 'bg-yellow-100',
    bar: 'bg-yellow-500',
    glow: '',
    glowColor: '#eab308',
    prevKm: 2300, nextKm: 3000, pulse: false
  }
  if (km < 4000) return {
    emoji: '🐸', label: '동비행기 개구리', sub: `${km.toFixed(0)} / 4,000km`,
    color: 'text-sky-700', borderColor: 'border-sky-200',
    bg: 'bg-sky-50',
    bar: 'bg-sky-500',
    glow: '',
    glowColor: '#0ea5e9',
    prevKm: 3000, nextKm: 4000, pulse: false
  }
  if (km < 5500) return {
    emoji: '🐸', label: '은비행기 개구리', sub: `${km.toFixed(0)} / 5,500km`,
    color: 'text-indigo-700', borderColor: 'border-indigo-200',
    bg: 'bg-indigo-50',
    bar: 'bg-indigo-500',
    glow: '',
    glowColor: '#4f46e5',
    prevKm: 4000, nextKm: 5500, pulse: false
  }
  return {
    emoji: '🐸', label: '금비행기 개구리 🚀', sub: `${km.toFixed(0)}km 달성!`,
    color: 'text-purple-700', borderColor: 'border-purple-200',
    bg: 'bg-purple-50',
    bar: 'bg-purple-500',
    glow: '',
    glowColor: '#9333ea',
    prevKm: 5500, nextKm: null, pulse: true
  }
}

export default function DashboardClient({
  userId,
  initialProfile,
  initialRecords,
  initialDues,
  totalDistanceKm = 0,
}: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient() as any

  // 상태 관리
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [records, setRecords] = useState<RunningRecord[]>(initialRecords)
  const [dues, setDues] = useState<DuesRow | null>(initialDues || null)
  const [isDuesActionLoading, setIsDuesActionLoading] = useState(false)
  const [totalDistance, setTotalDistance] = useState<number>(totalDistanceKm)

  // 랭킹 및 경쟁 데이터 상태
  const [weeklyRanking, setWeeklyRanking] = useState<{ userId: string; nickname: string; distance: number; rank: number }[]>([])
  const [monthlyRanking, setMonthlyRanking] = useState<{ userId: string; nickname: string; distance: number; rank: number }[]>([])
  const [encouragedRunner, setEncouragedRunner] = useState<{ nickname: string; distance: number; title: string } | null>(null)
  const [rankTab, setRankTab] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY')
  
  // 모달 제어
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false)
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState<boolean>(false)
  const [isLevelGuideOpen, setIsLevelGuideOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAllRecords, setShowAllRecords] = useState(false)

  // 월별 조회용 기준 날짜 (현재 화면에서 보고 있는 달의 1일)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = getKstDate()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  // 선택된 달이 이번 달인지 여부 (이번 달에만 '오늘 인증하기' 활성화)
  const today = getKstDate()
  const isCurrentMonth = 
    selectedDate.getFullYear() === today.getFullYear() && 
    selectedDate.getMonth() === today.getMonth()

  const joinDate = new Date(profile.created_at)
  const isJoinMonthSelected = 
    selectedDate.getFullYear() === joinDate.getFullYear() && 
    selectedDate.getMonth() === joinDate.getMonth()

  // 생존 상태 실시간 계산 (선택된 달의 기록 기반)
  const survivalStatus = calculateSurvival(records, profile.is_exempted || isJoinMonthSelected)

  // 누적 거리 다시 불러오기 (기록 추가/삭제 시 개구리 색상 갱신)
  const fetchTotalDistance = async () => {
    try {
      const { data: allRecs } = await supabase
        .from('running_records')
        .select('distance_km')
        .eq('user_id', userId)

      const total = (allRecs || []).reduce(
        (sum: number, r: any) => sum + parseFloat(String(r.distance_km || 0)),
        0
      )
      setTotalDistance(total)
    } catch (err) {
      console.error('누적거리 갱신 실패:', err)
    }
  }

  // 특정 달의 기록을 다시 불러오는 함수
  const fetchRecordsForDate = async (targetDate: Date) => {
    try {
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)

      const formatDate = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }

      const { data, error } = await supabase
        .from('running_records')
        .select('*')
        .eq('user_id', userId)
        .gte('run_date', formatDate(startOfMonth))
        .lte('run_date', formatDate(endOfMonth))
        .order('run_date', { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (err) {
      console.error('기록 갱신 실패:', err)
    }
  }

  // 전체 랭킹 및 격려 러너 데이터 로드
  const fetchRankings = async () => {
    try {
      const { data: pRes, error: pErr } = await supabase
        .from('profiles')
        .select('id, nickname, role')
        .eq('is_active', true)
        .neq('role', 'WAITING')
      
      if (pErr) throw pErr
      const activeProfiles = pRes || []

      const now = getKstDate()
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff)
      startOfWeek.setHours(0, 0, 0, 0)
      
      const formatYMD = formatKstYMD
      
      const startOfWeekStr = formatYMD(startOfWeek)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const startOfMonthStr = formatYMD(startOfMonth)
      const endOfMonthStr = formatYMD(endOfMonth)

      const [weeklyRecsRes, monthlyRecsRes] = await Promise.all([
        supabase.from('running_records').select('user_id, distance_km').gte('run_date', startOfWeekStr),
        supabase.from('running_records').select('user_id, distance_km').gte('run_date', startOfMonthStr).lte('run_date', endOfMonthStr)
      ])

      const weeklyRecs = weeklyRecsRes.data || []
      const monthlyRecs = monthlyRecsRes.data || []

      const weeklyMap: Record<string, number> = {}
      weeklyRecs.forEach((r: any) => {
        weeklyMap[r.user_id] = (weeklyMap[r.user_id] || 0) + parseFloat(String(r.distance_km || 0))
      })

      const monthlyMap: Record<string, number> = {}
      monthlyRecs.forEach((r: any) => {
        monthlyMap[r.user_id] = (monthlyMap[r.user_id] || 0) + parseFloat(String(r.distance_km || 0))
      })

      const weeklyList = activeProfiles.map((p: any) => ({
        userId: p.id,
        nickname: p.nickname,
        distance: weeklyMap[p.id] || 0
      })).sort((a: any, b: any) => b.distance - a.distance)

      const weeklyRanked = weeklyList.map((item: any, index: number) => ({
        ...item,
        rank: index + 1
      }))

      const monthlyList = activeProfiles.map((p: any) => ({
        userId: p.id,
        nickname: p.nickname,
        distance: monthlyMap[p.id] || 0
      })).sort((a: any, b: any) => b.distance - a.distance)

      const monthlyRanked = monthlyList.map((item: any, index: number) => ({
        ...item,
        rank: index + 1
      }))

      setWeeklyRanking(weeklyRanked)
      setMonthlyRanking(monthlyRanked)

      const minDistance = monthlyList.length > 0 ? monthlyList[monthlyList.length - 1].distance : 0
      const candidates = monthlyList.filter((item: any) => item.distance === minDistance)
      
      if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length)
        const chosen = candidates[randomIndex]
        const titles = [
          "🌱 포텐셜 러너 (충전 완료 시 무한 질주!)",
          "🚂 다음 달 폭주기관차 예약 완료!",
          "⚡️ 무시무시한 잠재력을 지닌 다크호스",
          "🐾 한 발짝씩 전진 중인 아기 거북이 러너",
          "🔋 엔진 가열 중! 다음 달 폭풍 성장 기대주"
        ]
        const chosenTitle = titles[Math.floor(Math.random() * titles.length)]
        
        setEncouragedRunner({
          nickname: chosen.nickname,
          distance: chosen.distance,
          title: chosenTitle
        })
      } else {
        setEncouragedRunner(null)
      }
    } catch (err) {
      console.error('Failed to load rankings:', err)
    }
  }

  // 월이 바뀔 때마다 데이터를 새로고침
  useEffect(() => {
    fetchRecordsForDate(selectedDate)
  }, [selectedDate])

  // 최초 로드 시 랭킹 데이터를 가져옴
  useEffect(() => {
    fetchRankings()
  }, [])

  const refreshRecords = async () => {
    await fetchRecordsForDate(selectedDate)
    await fetchTotalDistance()
    await fetchRankings()
  }

  // 월 이동 핸들러
  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  // 기록 삭제
  const handleDeleteRecord = async (id: string) => {
    if (!confirm('정말로 이 러닝 기록을 삭제하시겠습니까?')) return

    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('running_records')
        .delete()
        .eq('id', id)

      if (error) throw error
      setRecords(records.filter((r) => r.id !== id))
      // 누적거리도 갱신하여 개구리 색상 반영
      await fetchTotalDistance()
    } catch (err) {
      console.error('기록 삭제 에러:', err)
      alert('기록 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  // 프로필 업데이트 핸들러
  const handleProfileUpdate = (updatedFields: Partial<Profile>) => {
    setProfile(prev => ({ ...prev, ...updatedFields }))
  }

  // 회비 입금 확인 요청
  const handleDuesRequest = async () => {
    setIsDuesActionLoading(true)
    try {
      const currentMonthStr = getKstMonthStr()
      
      let res
      if (dues) {
        res = await supabase
          .from('dues')
          .update({ status: 'PENDING' })
          .eq('id', dues.id)
          .select()
          .single()
      } else {
        res = await supabase
          .from('dues')
          .insert({
            user_id: userId,
            target_month: currentMonthStr,
            status: 'PENDING',
            amount: 10000
          })
          .select()
          .single()
      }

      if (res.error) throw res.error
      if (res.data) setDues(res.data)
      alert('입금 확인 요청이 완료되었습니다.')
    } catch (err) {
      console.error('회비 요청 에러:', err)
      alert('오류가 발생했습니다.')
    } finally {
      setIsDuesActionLoading(false)
    }
  }

  // 상태값 계산
  const todayDate = today.getDate()
  const isDuesPeriod = todayDate >= 28
  
  // 신규 가입자(게스트) 승급 조건: 가입한 달이 이번 달 && 면제 상태 && 회비 납부 완료
  const isNewMemberThisMonth = joinDate.getFullYear() === today.getFullYear() && joinDate.getMonth() === today.getMonth()
  const showSecretKakaoLink = profile.is_exempted && isNewMemberThisMonth && dues?.status === 'PAID'

  // 프로필 역할 한글 변환
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { label: '크루장 👑', style: 'bg-red-50 border-red-200 text-red-600 font-bold' }
      case 'STAFF':
        return { label: '스태프 💜', style: 'bg-purple-50 border-purple-200 text-purple-650 font-bold' }
      case 'PACER_LEADER':
        return { label: '페이서팀장 💎', style: 'bg-teal-50 border-teal-200 text-teal-650 font-bold' }
      case 'PACER':
        return { label: '페이서 🎈', style: 'bg-emerald-50 border-emerald-200 text-emerald-600 font-bold' }
      case 'REGULAR':
        return { label: '일반크루원 🏃', style: 'bg-blue-50 border-blue-200 text-blue-600 font-bold' }
      case 'ADMIN':
        return { label: '스태프 💜', style: 'bg-purple-50 border-purple-200 text-purple-650 font-bold' }
      default:
        return { label: '대기회원 ⏳', style: 'bg-gray-100 border-gray-200 text-gray-500 font-bold' }
    }
  }

  const roleInfo = getRoleLabel(profile.role)

  return (
    <div className="min-h-screen bg-white px-4 py-8 pb-24 font-sans">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* 1. 상단 헤더: 사용자 정보 & 액션 */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CCFF00] text-gray-900 font-extrabold text-sm shadow-sm">
              SRC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {profile.nickname}
                </h1>
                <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${roleInfo.style}`}>
                  {roleInfo.label}
                </span>
                {/* 프로필 수정 버튼 */}
                <button
                  onClick={() => setIsProfileEditOpen(true)}
                  className="rounded-full p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-label="프로필 수정"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">러너님 오늘도 즐겁게 달려요!</p>
            </div>
          </div>
        </div>

        {/* 누적거리 등급 배지 */}
        {(() => {
          const lv = getDistanceLevel(totalDistance)
          const range = lv.nextKm ? lv.nextKm - lv.prevKm : 1
          const progress = lv.nextKm ? Math.min(100, ((totalDistance - lv.prevKm) / range) * 100) : 100
          return (
            <button
              onClick={() => setIsLevelGuideOpen(true)}
              className={`w-full rounded-2xl border ${lv.borderColor} ${lv.bg} p-3 flex items-center gap-3 ${lv.pulse ? 'animate-pulse' : ''} transition-all hover:brightness-110 active:scale-[0.99] text-left`}
            >
              <div className="flex-shrink-0 transition-all duration-300">
                <FrogIcon km={totalDistance} size="md" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-extrabold ${lv.color}`}>{lv.label}</span>
                  <span className="text-xs font-mono text-gray-900 font-bold">{totalDistance.toFixed(1)} km</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full transition-all duration-700 ${lv.bar}`} style={{ width: `${progress}%` }} />
                </div>
                {lv.nextKm ? (
                  <p className="text-[10px] text-gray-500 mt-1">다음 등급까지 {(lv.nextKm - totalDistance).toFixed(0)}km · 터치해서 등급표 보기</p>
                ) : (
                  <p className="text-[10px] text-[#CCFF00] font-bold bg-gray-900 px-2 py-0.5 rounded inline-block mt-1">🚀 최고 등급 달성! · 터치해서 등급표 보기</p>
                )}
              </div>
            </button>
          )
        })()}

        {/* 회비 납부 기간 배너 (콤팩트형) */}
        {profile.role !== 'WAITING' && !showSecretKakaoLink && (
          <DuesStatusBanner
            isNewMemberThisMonth={isNewMemberThisMonth}
            role={profile.role}
            duesStatus={dues?.status || null}
            isDuesPeriod={isDuesPeriod}
            month={today.getMonth() + 1}
            onRequestPayment={handleDuesRequest}
            isLoading={isDuesActionLoading}
          />
        )}

        {/* 2. 월 선택 (월별 히스토리 네비게이션) */}
        <div className="flex items-center justify-between px-2 pt-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-lg font-extrabold text-gray-950">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
          </h2>

          <button 
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className={`p-2 rounded-full transition-colors active:scale-95 ${
              isCurrentMonth 
                ? 'text-gray-200 cursor-not-allowed' 
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 3. 메인: 생존 대시보드 진행도 */}
        <SurvivalProgress status={survivalStatus} />

        {/* 4. 기록 인증 버튼 (이번 달인 경우에만 활성화) */}
        <div className="pt-2">
          {isCurrentMonth ? (
            <div className="flex gap-4">
              <button
                onClick={() => setIsFormOpen(true)}
                className="
                  flex-1 py-4 rounded-2xl
                  bg-[#CCFF00] text-gray-900 font-extrabold text-sm tracking-wide
                  flex items-center justify-center gap-2
                  hover:bg-[#b8e600]
                  transition-all duration-300 active:scale-[0.98]
                "
              >
                러닝 인증하기
              </button>
              
              <button
                onClick={() => setIsExpenseFormOpen(true)}
                className="
                  w-[80px] py-4 rounded-2xl
                  bg-gray-100 border border-gray-200
                  text-gray-600 text-xs font-bold
                  flex items-center justify-center
                  hover:bg-gray-200 hover:text-gray-900
                  transition-all duration-300 active:scale-[0.98]
                "
                title="지출 청구"
              >
                지출청구
              </button>
            </div>
          ) : (
            <div className="w-full py-4 rounded-2xl border border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500">
              {selectedDate.getMonth() + 1}월은 이미 마감된 달입니다.
            </div>
          )}
        </div>
        {/* 4.5. 실시간 마일리지 랭킹보드 (컴포넌트 분리) */}
        <RankingBoard
          weeklyRanking={weeklyRanking}
          monthlyRanking={monthlyRanking}
          encouragedRunner={encouragedRunner}
          userId={userId}
        />

        {/* 5. 최근 러닝 기록 (컴포넌트 분리) */}
        <MonthlyRecordList
          records={records}
          selectedDate={selectedDate}
          isCurrentMonth={isCurrentMonth}
          deletingId={deletingId}
          showAllRecords={showAllRecords}
          onDeleteRecord={handleDeleteRecord}
          onToggleShowAll={() => setShowAllRecords(!showAllRecords)}
        />

        {/* 6. 퀵 액세스 그리드 (컴포넌트 분리 - 퀵 메뉴 및 크루 라운지 통합) */}
        <QuickAccessGrid
          userRole={profile.role}
          onLogout={handleLogout}
        />
      </div>

      {/* 모달 1. 러닝 기록 입력 */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-6 flex items-start md:items-center justify-center animate-in fade-in duration-200">
          <RunningAuthForm
            userId={userId}
            userRole={profile.role}
            onSuccess={refreshRecords}
            onClose={() => setIsFormOpen(false)}
          />
        </div>
      )}

      {/* 모달 2. 프로필 수정 */}
      {isProfileEditOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-6 flex items-start md:items-center justify-center animate-in fade-in duration-200">
          <ProfileEditForm
            userId={userId}
            initialNickname={profile.nickname}
            initialPhone={profile.phone || ''}
            onSuccess={handleProfileUpdate}
            onClose={() => setIsProfileEditOpen(false)}
          />
        </div>
      )}
      {/* 모달 3. 지출 청구 */}
      {isExpenseFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-6 flex items-start md:items-center justify-center animate-in fade-in duration-200">
          <ExpenseClaimForm
            userId={userId}
            onSuccess={() => setIsExpenseFormOpen(false)}
            onClose={() => setIsExpenseFormOpen(false)}
          />
        </div>
      )}

      {/* 모달 4. 개구리 등급 가이드 */}
      {isLevelGuideOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/40 backdrop-blur-sm px-4 py-6 flex items-start md:items-center justify-center animate-in fade-in duration-200" onClick={() => setIsLevelGuideOpen(false)}>
          <div 
            className="w-full max-w-sm rounded-3xl bg-white border border-gray-200 p-6 space-y-4 relative overflow-hidden"
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
                const isCurrent = idx === 0 ? totalDistance < 300 :
                                  idx === 1 ? totalDistance >= 300 && totalDistance < 600 :
                                  idx === 2 ? totalDistance >= 600 && totalDistance < 1000 :
                                  idx === 3 ? totalDistance >= 1000 && totalDistance < 1600 :
                                  idx === 4 ? totalDistance >= 1600 && totalDistance < 2300 :
                                  idx === 5 ? totalDistance >= 2300 && totalDistance < 3000 :
                                  idx === 6 ? totalDistance >= 3000 && totalDistance < 4000 :
                                  idx === 7 ? totalDistance >= 4000 && totalDistance < 5500 :
                                  totalDistance >= 5500;
                
                return (
                  <div 
                    key={item.label}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isCurrent 
                        ? 'bg-[#CCFF00] border-[#b8e600]' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <FrogIcon km={item.km} size="sm" />
                      <div>
                        <p className={`text-xs font-bold ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}>
                          {item.label}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.range}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] bg-gray-900 text-[#CCFF00] font-bold px-2 py-1 rounded-md">
                        현재 등급
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
                className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold transition-all border border-gray-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA 설치 안내 */}
      <InstallPrompt />
      {/* 레거시 기록 이관 팝업 (WAITING 제외한 기존 회원 대상) */}
      {profile.role !== 'WAITING' && (
        <MigrationPrompt nickname={profile.nickname} />
      )}
    </div>
  )
}
