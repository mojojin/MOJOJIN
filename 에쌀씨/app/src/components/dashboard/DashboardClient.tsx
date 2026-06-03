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
}

export default function DashboardClient({
  userId,
  initialProfile,
  initialRecords,
  initialMarathonPBs,
  initialDues,
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/calendar')}
              className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all active:scale-[0.98]"
            >
              📅 일정
            </button>
            <button
              onClick={() => router.push('/rules')}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-all active:scale-[0.98]"
            >
              📜 회칙
            </button>
            {profile.role !== 'WAITING' && (
              <button
                onClick={() => router.push('/crew')}
                className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all active:scale-[0.98]"
              >
                👀 크루 조회
              </button>
            )}
            {profile.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin')}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98]"
              >
                ⚙️ 관리자
              </button>
            )}
            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-gray-400 hover:bg-white/5 hover:text-white transition-all active:scale-[0.98]"
            >
              로그아웃
            </button>
          </div>
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

        {/* 5. 최근 등록 내역 */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              {selectedDate.getMonth() + 1}월 러닝 기록 ({records.length}회)
            </h3>
            <span className="text-xs text-gray-500">최신순</span>
          </div>

          {records.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-10 text-center text-sm text-gray-500 leading-normal">
              {isCurrentMonth 
                ? "아직 이번 달 인증한 러닝 기록이 없습니다.\n첫 달리기를 인증하고 생존에 도전해 보세요! ⚡️"
                : "해당 월에 인증된 기록이 없습니다."}
            </div>
          ) : (
            <div className="space-y-2.5">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="
                    relative overflow-hidden flex items-center justify-between
                    rounded-2xl border border-white/5 bg-gray-900/40 p-4
                    backdrop-blur-sm transition-all hover:bg-gray-900/60
                  "
                >
                  <div className="flex items-center gap-3">
                    {/* 러닝 타입 장식 */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm ${
                        record.run_type === 'REGULAR'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {record.run_type === 'REGULAR' ? '벙' : '개인'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-white tracking-tight">
                          {parseFloat(String(record.distance_km)).toFixed(1)} km
                        </span>
                        {record.is_pacing && (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                            🎈 페이서
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <span>📍 {record.location_name_snapshot}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-700" />
                        <span>🗓️ {record.run_date}</span>
                      </p>
                    </div>
                  </div>

                  {/* 삭제 버튼 (이번 달 기록이거나 ADMIN일 때만 삭제 가능하게 하려면 조건을 추가할 수 있으나, 본인 기록이면 일단 삭제 가능하도록 유지) */}
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    disabled={deletingId === record.id}
                    className="
                      rounded-xl border border-white/5 bg-white/[0.02] p-2
                      text-gray-500 hover:text-red-400 hover:bg-red-500/10
                      transition-colors disabled:opacity-50
                    "
                    aria-label="기록 삭제"
                  >
                    {deletingId === record.id ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
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
