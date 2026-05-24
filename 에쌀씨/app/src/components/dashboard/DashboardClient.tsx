'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateSurvival } from '@/utils/survival'
import SurvivalProgress from './SurvivalProgress'
import RunningAuthForm from './RunningAuthForm'
import MarathonPBCard from '@/components/marathon/MarathonPBCard'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']
type MarathonPB = Database['public']['Tables']['marathon_pbs']['Row']

interface DashboardClientProps {
  userId: string
  initialProfile: Profile
  initialRecords: RunningRecord[]
  initialMarathonPBs: MarathonPB[]
}

export default function DashboardClient({
  userId,
  initialProfile,
  initialRecords,
  initialMarathonPBs,
}: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // 상태 관리
  const [profile] = useState<Profile>(initialProfile)
  const [records, setRecords] = useState<RunningRecord[]>(initialRecords)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 생존 상태 실시간 계산
  const survivalStatus = calculateSurvival(records, profile.is_exempted)

  // 최신 기록 동기화
  const refreshRecords = async () => {
    try {
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

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
      if (data) {
        setRecords(data)
      }
    } catch (err) {
      console.error('기록 갱신 실패:', err)
    }
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

      // 로컬 상태 즉각 반영 (낙관적 갱신 / 즉시 필터)
      setRecords(records.filter((r) => r.id !== id))
    } catch (err) {
      console.error('기록 삭제 에러:', err)
      alert('기록 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  // 프로필 역할 한글 변환 및 배지 표기
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
        {/* 상단 헤더: 사용자 정보 & 로그아웃 */}
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
              </div>
              <p className="text-xs text-gray-500 mt-0.5">러너님 오늘도 즐겁게 달려요!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile.role === 'ADMIN' && (
              <button
                onClick={() => router.push('/admin')}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98]"
              >
                ⚙️ 관리자
              </button>
            )}
            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-gray-400 hover:bg-white/5 hover:text-white transition-all active:scale-[0.98]"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 메인: 생존 대시보드 진행도 */}
        <SurvivalProgress status={survivalStatus} />

        {/* 기록 인증 작성 플로팅/버튼 */}
        <div className="pt-2">
          <button
            onClick={() => setIsFormOpen(true)}
            className="
              w-full py-4 rounded-3xl
              bg-gradient-to-r from-emerald-500 to-teal-400
              text-black font-extrabold text-[15px] tracking-wide
              flex items-center justify-center gap-2
              hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]
              transition-all duration-300 active:scale-[0.98]
            "
          >
            <span>🏃</span>
            오늘의 러닝 인증하기
          </button>
        </div>

        {/* 마라톤 개인 최고기록 섹션 */}
        <MarathonPBCard userId={userId} initialPBs={initialMarathonPBs} />

        {/* 최근 등록 내역 (이번 달 내 기록) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              이번 달 러닝 기록 ({records.length}회)
            </h3>
            <span className="text-xs text-gray-500">최신순</span>
          </div>

          {records.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-10 text-center text-sm text-gray-500 leading-normal">
              아직 이번 달 인증한 러닝 기록이 없습니다.
              <br />
              <span className="text-xs text-gray-600 block mt-1.5">
                첫 달리기를 인증하고 생존에 도전해 보세요! ⚡️
              </span>
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
                    {/* 러닝 타입에 따른 컬러 장식 */}
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

                  {/* 삭제 버튼 */}
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
                      <svg
                        className="animate-spin h-4 w-4"
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
                    ) : (
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 기록 입력 모달 오버레이 */}
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
    </div>
  )
}
