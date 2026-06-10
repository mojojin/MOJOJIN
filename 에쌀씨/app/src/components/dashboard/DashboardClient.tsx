'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateSurvival } from '@/utils/survival'
import SurvivalProgress from './SurvivalProgress'
import RunningAuthForm from './RunningAuthForm'
import ProfileEditForm from './ProfileEditForm'
import ExpenseClaimForm from './ExpenseClaimForm'
import MarathonPBCard from '@/components/marathon/MarathonPBCard'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']
type MarathonPB = Database['public']['Tables']['marathon_pbs']['Row']
type DuesRow = Database['public']['Tables']['dues']['Row']

interface DashboardClientProps {
  userId: string
  initialProfile: Profile
  initialRecords: RunningRecord[]
  initialMarathonPBs: MarathonPB[]
  initialDues?: DuesRow | null
  totalDistanceKm?: number
}

// 누적거리 기반 등급 시스템
function getDistanceLevel(km: number) {
  if (km < 300) return {
    emoji: '🥉', label: '동메달', sub: `${km.toFixed(0)} / 300km`,
    color: 'text-orange-400', borderColor: 'border-orange-500/30',
    bg: 'bg-gradient-to-r from-orange-900/30 to-amber-900/20',
    bar: 'bg-gradient-to-r from-orange-500 to-amber-400',
    prevKm: 0, nextKm: 300, pulse: false
  }
  if (km < 600) return {
    emoji: '🥈', label: '은메달', sub: `${km.toFixed(0)} / 600km`,
    color: 'text-slate-300', borderColor: 'border-slate-400/30',
    bg: 'bg-gradient-to-r from-slate-800/50 to-gray-800/30',
    bar: 'bg-gradient-to-r from-slate-400 to-gray-300',
    prevKm: 300, nextKm: 600, pulse: false
  }
  if (km < 1000) return {
    emoji: '🥇', label: '금메달', sub: `${km.toFixed(0)} / 1,000km`,
    color: 'text-yellow-400', borderColor: 'border-yellow-500/30',
    bg: 'bg-gradient-to-r from-yellow-900/40 to-amber-900/30',
    bar: 'bg-gradient-to-r from-yellow-400 to-amber-300',
    prevKm: 600, nextKm: 1000, pulse: false
  }
  if (km < 1600) return {
    emoji: '🏆', label: '동트로피', sub: `${km.toFixed(0)} / 1,600km`,
    color: 'text-orange-400', borderColor: 'border-orange-500/30',
    bg: 'bg-gradient-to-r from-orange-900/40 to-red-900/20',
    bar: 'bg-gradient-to-r from-orange-600 to-orange-400',
    prevKm: 1000, nextKm: 1600, pulse: false
  }
  if (km < 2300) return {
    emoji: '🏆', label: '은트로피', sub: `${km.toFixed(0)} / 2,300km`,
    color: 'text-slate-300', borderColor: 'border-slate-400/30',
    bg: 'bg-gradient-to-r from-slate-700/50 to-slate-800/30',
    bar: 'bg-gradient-to-r from-slate-300 to-slate-400',
    prevKm: 1600, nextKm: 2300, pulse: false
  }
  if (km < 3000) return {
    emoji: '🏆', label: '금트로피', sub: `${km.toFixed(0)} / 3,000km`,
    color: 'text-yellow-300', borderColor: 'border-yellow-400/40',
    bg: 'bg-gradient-to-r from-yellow-900/50 to-amber-700/30',
    bar: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500',
    prevKm: 2300, nextKm: 3000, pulse: false
  }
  if (km < 4000) return {
    emoji: '🛩️', label: '동비행기', sub: `${km.toFixed(0)} / 4,000km`,
    color: 'text-sky-400', borderColor: 'border-sky-400/30',
    bg: 'bg-gradient-to-r from-sky-900/40 to-cyan-900/20',
    bar: 'bg-gradient-to-r from-sky-400 to-cyan-300',
    prevKm: 3000, nextKm: 4000, pulse: false
  }
  if (km < 5500) return {
    emoji: '✈️', label: '은비행기', sub: `${km.toFixed(0)} / 5,500km`,
    color: 'text-indigo-300', borderColor: 'border-indigo-400/30',
    bg: 'bg-gradient-to-r from-indigo-900/50 to-blue-900/30',
    bar: 'bg-gradient-to-r from-indigo-400 to-blue-400',
    prevKm: 4000, nextKm: 5500, pulse: false
  }
  return {
    emoji: '🚀', label: '금비행기', sub: `${km.toFixed(0)}km 달성!`,
    color: 'text-purple-300', borderColor: 'border-purple-400/40',
    bg: 'bg-gradient-to-r from-purple-900/60 to-fuchsia-900/40',
    bar: 'bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400',
    prevKm: 5500, nextKm: null, pulse: true
  }
}

export default function DashboardClient({
  userId,
  initialProfile,
  initialRecords,
  initialMarathonPBs,
  initialDues,
  totalDistanceKm = 0,
}: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // 상태 관리
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [records, setRecords] = useState<RunningRecord[]>(initialRecords)
  const [dues, setDues] = useState<DuesRow | null>(initialDues || null)
  const [isDuesActionLoading, setIsDuesActionLoading] = useState(false)
  
  // 모달 제어
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false)
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 월별 조회용 기준 날짜 (현재 화면에서 보고 있는 달의 1일)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  // 선택된 달이 이번 달인지 여부 (이번 달에만 '오늘 인증하기' 활성화)
  const today = new Date()
  const isCurrentMonth = 
    selectedDate.getFullYear() === today.getFullYear() && 
    selectedDate.getMonth() === today.getMonth()

  // 생존 상태 실시간 계산 (선택된 달의 기록 기반)
  const survivalStatus = calculateSurvival(records, profile.is_exempted)

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

  // 월이 바뀔 때마다 데이터를 새로고침
  useEffect(() => {
    // 최초 렌더링 시에는 initialRecords가 있으므로 건너뛸 수 있지만,
    // 월이 변경될 때는 fetchRecordsForDate를 호출해야 함.
    // 여기서는 심플하게 selectedDate가 바뀔 때 무조건 fetch하도록 함.
    fetchRecordsForDate(selectedDate)
  }, [selectedDate])

  const refreshRecords = () => fetchRecordsForDate(selectedDate)

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
    if (!confirm('운영진에게 입금 확인을 요청하시겠습니까?')) return
    setIsDuesActionLoading(true)
    try {
      const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      
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
  const joinDate = new Date(profile.created_at)
  const isNewMemberThisMonth = joinDate.getFullYear() === today.getFullYear() && joinDate.getMonth() === today.getMonth()
  const showSecretKakaoLink = profile.is_exempted && isNewMemberThisMonth && dues?.status === 'PAID'

  // 프로필 역할 한글 변환
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: '운영자 👑', style: 'bg-red-500/10 border-red-500/30 text-red-400' }
      case 'PACER':
        return { label: '페이서 🎈', style: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' }
      case 'REGULAR':
        return { label: '정회원 🏃', style: 'bg-blue-500/10 border-blue-500/30 text-blue-400' }
      default:
        return { label: '대기회원 ⏳', style: 'bg-gray-500/10 border-gray-500/30 text-gray-400' }
    }
  }

  const roleInfo = getRoleLabel(profile.role)

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100 pb-24">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* 1. 상단 헤더: 사용자 정보 & 액션 */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-2xl shadow-lg">
              🏃✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {profile.nickname}
                </h1>
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${roleInfo.style}`}>
                  {roleInfo.label}
                </span>
                {/* 프로필 수정 버튼 */}
                <button
                  onClick={() => setIsProfileEditOpen(true)}
                  className="rounded-full p-1 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="프로필 수정"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">러너님 오늘도 즐겁게 달려요!</p>
            </div>
          </div>
        </div>

        {/* 누적거리 등급 배지 */}
        {(() => {
          const lv = getDistanceLevel(totalDistanceKm)
          const range = lv.nextKm ? lv.nextKm - lv.prevKm : 1
          const progress = lv.nextKm ? Math.min(100, ((totalDistanceKm - lv.prevKm) / range) * 100) : 100
          return (
            <div className={`rounded-2xl border ${lv.borderColor} ${lv.bg} p-3 flex items-center gap-3 ${lv.pulse ? 'animate-pulse' : ''}`}>
              <div className="text-3xl flex-shrink-0">{lv.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-extrabold ${lv.color}`}>{lv.label}</span>
                  <span className="text-xs font-mono text-white font-bold">{totalDistanceKm.toFixed(1)} km</span>
                </div>
                <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${lv.bar}`} style={{ width: `${progress}%` }} />
                </div>
                {lv.nextKm ? (
                  <p className="text-[10px] text-white/40 mt-0.5">다음 등급까지 {(lv.nextKm - totalDistanceKm).toFixed(0)}km</p>
                ) : (
                  <p className="text-[10px] text-purple-300 mt-0.5">🚀 최고 등급 달성!</p>
                )}
              </div>
            </div>
          )
        })()}

        {/* 퀵 메뉴 그리드 */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => router.push('/calendar')} className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 border border-white/5 py-3 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all active:scale-95 group">
            <span className="text-xl">📅</span>
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-amber-400">일정</span>
          </button>
          <button onClick={() => router.push('/rules')} className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 border border-white/5 py-3 hover:bg-white/10 transition-all active:scale-95 group">
            <span className="text-xl">📜</span>
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-white">회칙</span>
          </button>
          {profile.role !== 'WAITING' && (
            <button onClick={() => router.push('/crew')} className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 border border-white/5 py-3 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all active:scale-95 group">
              <span className="text-xl">👥</span>
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-400">크루</span>
            </button>
          )}
          {profile.role === 'ADMIN' ? (
            <button onClick={() => router.push('/admin')} className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 border border-white/5 py-3 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all active:scale-95 group">
              <span className="text-xl">⚙️</span>
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-emerald-400">관리자</span>
            </button>
          ) : (
            <button onClick={handleLogout} className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 border border-white/5 py-3 hover:bg-red-500/10 transition-all active:scale-95 group">
              <span className="text-xl">🚪</span>
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-red-400">로그아웃</span>
            </button>
          )}
        </div>

        {/* 신규 가입자 전용 시크릿 배너 */}
        {showSecretKakaoLink && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 p-5 mt-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-4xl">🎉</div>
            <h3 className="text-sm font-extrabold text-amber-400 mb-2 tracking-tight">환영합니다! 정회원 승급 완료 🚀</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              회비 납부 및 승급 처리가 완료되었습니다.<br/>
              이제 정회원 단톡방에 입장하셔서 함께 달려주세요!
            </p>
            <div className="bg-black/40 rounded-xl p-3 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">단톡방 참여코드(비밀번호)</span>
                <span className="font-mono font-bold text-amber-400 tracking-widest text-sm bg-amber-400/10 px-2 py-0.5 rounded">20210317</span>
              </div>
            </div>
          </div>
        )}

        {/* 회비 납부 기간 배너 */}
        {isDuesPeriod && profile.role !== 'WAITING' && !showSecretKakaoLink && (
          <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5 mt-4 relative overflow-hidden">
            {dues?.status === 'PAID' ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">💖</div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">이번 달 회비 납부 완료</h3>
                  <p className="text-xs text-emerald-400 mt-0.5">납부해주셔서 감사합니다!</p>
                </div>
              </div>
            ) : dues?.status === 'PENDING' ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">⏳</div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">입금 확인 대기 중</h3>
                  <p className="text-xs text-blue-400 mt-0.5">운영진이 확인 후 승인해 드릴 예정입니다.</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-extrabold text-white mb-2 flex items-center gap-2">
                  <span className="text-emerald-400">📢</span> {today.getMonth() + 1}월 회비 납부 기간입니다
                </h3>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                  원활한 크루 운영을 위해 말일까지 회비(10,000원) 납부를 부탁드립니다.<br/>
                  <span className="text-gray-300 font-bold">카카오뱅크 3333-12-3456789 (수원러닝크루)</span>
                </p>
                <button
                  onClick={handleDuesRequest}
                  disabled={isDuesActionLoading}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all disabled:opacity-50 border border-white/10"
                >
                  {isDuesActionLoading ? '처리 중...' : '💸 방금 입금했습니다 (확인 요청)'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. 월 선택 (월별 히스토리 네비게이션) */}
        <div className="flex items-center justify-between px-2 pt-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-lg font-extrabold text-white">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
          </h2>

          <button 
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className={`p-2 rounded-full transition-colors active:scale-95 ${
              isCurrentMonth 
                ? 'text-gray-800 cursor-not-allowed' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
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
            <div className="flex gap-2">
              <button
                onClick={() => setIsFormOpen(true)}
                className="
                  flex-1 py-4 rounded-3xl
                  bg-gradient-to-r from-emerald-500 to-teal-400
                  text-black font-extrabold text-[15px] tracking-wide
                  flex items-center justify-center gap-2
                  hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]
                  transition-all duration-300 active:scale-[0.98]
                "
              >
                <span>🏃</span> 러닝 인증
              </button>
              
              <button
                onClick={() => setIsExpenseFormOpen(true)}
                className="
                  w-[120px] py-4 rounded-3xl
                  bg-gray-800 border border-white/10
                  text-white font-extrabold text-[13px] tracking-wide
                  flex flex-col items-center justify-center gap-0.5
                  hover:bg-gray-700
                  transition-all duration-300 active:scale-[0.98]
                "
              >
                <span>💸</span> 지출 청구
              </button>
            </div>
          ) : (
            <div className="w-full py-3.5 rounded-3xl border border-white/5 bg-white/[0.02] text-center text-xs font-medium text-gray-500">
              {selectedDate.getMonth() + 1}월은 이미 마감된 달입니다.
            </div>
          )}
        </div>

        {/* 5. 최근 러닝 기록 (최대 5개) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {selectedDate.getMonth() + 1}월 기록 ({records.length}회)
            </h3>
            <span className="text-[10px] text-gray-600">최신순</span>
          </div>

          {records.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] py-8 text-center text-xs text-gray-600">
              {isCurrentMonth ? '아직 이번 달 기록이 없어요. 첫 달리기를 인증해보세요! ⚡️' : '해당 월 기록 없음'}
            </div>
          ) : (
            <div className="space-y-1.5">
              {records.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-gray-900/40 px-3 py-2.5 hover:bg-gray-900/60 transition-all">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    record.run_type === 'REGULAR'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {record.run_type === 'REGULAR' ? '벙' : '개인'}
                  </span>
                  <span className="text-sm font-extrabold text-white">{parseFloat(String(record.distance_km)).toFixed(1)}<span className="text-xs text-gray-500 font-normal"> km</span></span>
                  {record.is_pacing && <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">🎈페이서</span>}
                  <span className="text-xs text-gray-600 ml-auto">{record.run_date}</span>
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    disabled={deletingId === record.id}
                    className="p-1 text-gray-700 hover:text-red-400 transition-colors disabled:opacity-40"
                    aria-label="삭제"
                  >
                    {deletingId === record.id ? (
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    ) : (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    )}
                  </button>
                </div>
              ))}
              {records.length > 5 && (
                <p className="text-center text-[10px] text-gray-600 pt-1">+{records.length - 5}개 더 있음</p>
              )}
            </div>
          )}
        </div>
        
        {/* 6. 마라톤 개인 최고기록 섹션 */}
        <div className="pt-6">
          <MarathonPBCard userId={userId} initialPBs={initialMarathonPBs} />
        </div>
        
        {/* 7. 크루 라운지 (신규 기능 모음) */}
        <div className="pt-6">
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              🗂️ 크루 라운지
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfwOtxX6f6UZt8d2MA66KUIRQ_CcuzCfKhocl6oC9PmdZYfPg/viewform"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 text-lg">👕</div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">SRC 굿즈 구매</h4>
                  <p className="text-xs text-gray-400 mt-0.5">싱글렛, 티셔츠 등 크루 공식 굿즈</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            <button
              onClick={() => router.push('/marathons')}
              className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors group text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 text-lg">🏅</div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">마라톤 대회 명단</h4>
                  <p className="text-xs text-gray-400 mt-0.5">대회 참가 현황 및 일정 확인</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-500 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/suggestions')}
              className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors group text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 text-lg">💡</div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">크루 건의함</h4>
                  <p className="text-xs text-gray-400 mt-0.5">운영진에게 전하는 익명/기명 의견</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/lounge')}
              className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-colors group text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 text-lg">🎰</div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">크루 라운지</h4>
                  <p className="text-xs text-gray-400 mt-0.5">월별 경품 추첨</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-500 group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/gpx')}
              className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors group text-left w-full"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 text-lg">🗺️</div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">GPX 코스</h4>
                  <p className="text-xs text-gray-400 mt-0.5">코스 파일 다운로드</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-500 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
      </div>

      {/* 모달 1. 러닝 기록 입력 */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <ExpenseClaimForm
            userId={userId}
            onSuccess={() => setIsExpenseFormOpen(false)}
            onClose={() => setIsExpenseFormOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
