'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface MemberManagerProps {
  initialProfiles: Profile[]
}

export default function MemberManager({ initialProfiles }: MemberManagerProps) {
  const supabase = createClient() as any
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // 승인 대기 회원 (role === 'WAITING' 이고 is_active === true)
  const waitingMembers = profiles.filter(
    (p) => p.role === 'WAITING' && p.is_active
  )

  // 정식 회원 목록 (role !== 'WAITING' 이고 is_active === true)
  const activeMembers = profiles.filter(
    (p) => p.role !== 'WAITING' && p.is_active
  )

  // 검색어 필터링
  const filteredActiveMembers = activeMembers.filter((p) =>
    p.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 회원 승인 (WAITING -> REGULAR)
  const handleApprove = async (id: string) => {
    setActionInProgress(id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'REGULAR' })
        .eq('id', id)

      if (error) throw error

      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, role: 'REGULAR' as const } : p))
      )
    } catch (err) {
      console.error('Failed to approve member:', err)
      alert('회원 승인 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  // 회원 거절 (삭제)
  const handleReject = async (id: string, nickname: string) => {
    if (!confirm(`정말 ${nickname}님의 가입 요청을 거절하고 삭제하시겠습니까?`)) return
    setActionInProgress(id)
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)

      if (error) throw error

      setProfiles((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Failed to reject member:', err)
      alert('가입 거절 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  // 역할 변경 (REGULAR / PACER / ADMIN)
  const handleRoleChange = async (id: string, newRole: Profile['role']) => {
    setActionInProgress(id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id)

      if (error) throw error

      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, role: newRole } : p))
      )
    } catch (err) {
      console.error('Failed to update role:', err)
      alert('역할 변경 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  // 면제 여부 토글 (is_exempted)
  const handleExemptToggle = async (id: string, currentExempt: boolean) => {
    setActionInProgress(id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_exempted: !currentExempt })
        .eq('id', id)

      if (error) throw error

      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_exempted: !currentExempt } : p))
      )
    } catch (err) {
      console.error('Failed to toggle exemption:', err)
      alert('면제 여부 토글 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  // 강퇴 처리 (is_active = false)
  const handleKick = async (id: string, nickname: string) => {
    if (!confirm(`정말 ${nickname} 회원을 탈퇴/강퇴 처리하시겠습니까?`)) return
    setActionInProgress(id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: false } : p))
      )
    } catch (err) {
      console.error('Failed to kick member:', err)
      alert('강퇴 처리 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. 승인 대기 회원 목록 */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏳</span>
            <h2 className="text-base font-bold text-white">가입 승인 대기</h2>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400">
              {waitingMembers.length}명
            </span>
          </div>
        </div>

        {waitingMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-2xl mb-2">🎉</span>
            <p className="text-sm text-gray-500 font-medium">대기 중인 회원이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {waitingMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{member.nickname}</span>
                    {member.phone && (
                      <span className="text-[10px] text-gray-500 font-medium">{member.phone}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    가입 신청일: {new Date(member.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(member.id)}
                    disabled={actionInProgress === member.id}
                    className="
                      rounded-xl bg-emerald-500 hover:bg-emerald-600
                      px-4 py-2 text-xs font-bold text-black
                      transition-all duration-200 active:scale-[0.95]
                      disabled:opacity-50
                    "
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleReject(member.id, member.nickname)}
                    disabled={actionInProgress === member.id}
                    className="
                      rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400
                      px-4 py-2 text-xs font-bold text-gray-300
                      transition-all duration-200 active:scale-[0.95]
                      disabled:opacity-50
                    "
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 회원 목록 */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h2 className="text-base font-bold text-white">크루원 관리</h2>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
              {activeMembers.length}명
            </span>
          </div>

          {/* 검색 바 */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="닉네임 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full rounded-xl border border-white/10 bg-white/[0.03]
                pl-9 pr-4 py-2 text-xs text-white placeholder-gray-600
                focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20
                focus:outline-none transition-colors
              "
            />
            <svg
              className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {filteredActiveMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-xl mb-2">🔍</span>
            <p className="text-sm text-gray-500 font-medium">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">닉네임</th>
                  <th className="pb-3 font-semibold">연락처</th>
                  <th className="pb-3 font-semibold text-center">면제 여부</th>
                  <th className="pb-3 font-semibold">역할</th>
                  <th className="pb-3 font-semibold text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredActiveMembers.map((member) => (
                  <tr key={member.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="py-3.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{member.nickname}</span>
                        {member.is_exempted && (
                          <span className="rounded bg-sky-500/10 border border-sky-500/20 px-1 py-0.5 text-[9px] font-bold text-sky-400">
                            면제
                          </span>
                        )}
                        {member.role === 'ADMIN' && (
                          <span className="rounded bg-red-500/10 border border-red-500/20 px-1 py-0.5 text-[9px] font-bold text-red-400">
                            ADMIN
                          </span>
                        )}
                        {member.role === 'PACER' && (
                          <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 text-[9px] font-bold text-emerald-400">
                            PACER
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-xs text-gray-400">
                      {member.phone || '-'}
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleExemptToggle(member.id, member.is_exempted)}
                        disabled={actionInProgress === member.id}
                        className={`
                          inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-[10px] font-bold
                          transition-all duration-200 active:scale-[0.95] disabled:opacity-50
                          ${
                            member.is_exempted
                              ? 'border-sky-500/20 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                          }
                        `}
                      >
                        {member.is_exempted ? '면제됨' : '면제하기'}
                      </button>
                    </td>
                    <td className="py-3.5">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as Profile['role'])
                        }
                        disabled={actionInProgress === member.id}
                        className="
                          rounded-xl border border-white/10 bg-gray-900/90
                          px-2 py-1 text-xs font-semibold text-gray-300
                          focus:border-emerald-500/40 focus:outline-none transition-colors
                          disabled:opacity-50
                        "
                      >
                        <option value="REGULAR">일반 크루원</option>
                        <option value="PACER">페이서</option>
                        <option value="ADMIN">운영진 (ADMIN)</option>
                      </select>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleKick(member.id, member.nickname)}
                        disabled={actionInProgress === member.id}
                        className="
                          rounded-lg border border-transparent px-2.5 py-1 text-[10px] font-bold text-gray-500
                          hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20
                          transition-all duration-200 active:scale-[0.95] disabled:opacity-50
                        "
                      >
                        강퇴
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
