'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateSurvival, isRunningExempt, isJoinedThisMonth } from '@/utils/survival'
import type { Database } from '@/lib/types/database.types'

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'OWNER': return '크루장'
    case 'STAFF': return '스태프'
    case 'PACER_LEADER': return '페이서팀장'
    case 'PACER': return '페이서'
    case 'REGULAR': return '일반 크루원'
    case 'ADMIN': return '스태프'
    case 'WAITING': return '대기회원'
    default: return role
  }
}

type Profile = Database['public']['Tables']['profiles']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface MemberManagerProps {
  initialProfiles: Profile[]
  records?: RunningRecord[]
}

export default function MemberManager({ initialProfiles, records = [] }: MemberManagerProps) {
  const supabase = createClient() as any
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  
  // 상태/메모 수정 모달 상태
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [statusText, setStatusText] = useState('')
  const [adminMemo, setAdminMemo] = useState('')

  // 닉네임 정형화 정규식
  const nicknameRegex = /^[가-힣]{2,10}\/\d{2}\/[남여]$/

  // 1. 가입 승인 대기 회원 (가입 정보를 제출하여 닉네임과 전화번호가 올바른 대기자)
  const waitingMembers = profiles.filter(
    (p) => p.role === 'WAITING' && 
           p.is_active && 
           p.phone && 
           nicknameRegex.test(p.nickname || '') &&
           !p.kakao_id?.startsWith('mock_')
  )

  // 가입 정보를 제출하지 않은 미작성 대기자는 완전히 보이지 않도록 필터링 처리합니다.

  // 정식 회원 목록 (role !== 'WAITING', mock 제외)
  // is_active === false 인 강퇴 회원도 필터 버튼 등으로 볼 수 있게 할 수 있으나, 일단은 active만 노출
  const activeMembers = profiles.filter(
    (p) => p.role !== 'WAITING' && p.is_active && !p.kakao_id?.startsWith('mock_')
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

  // 회원 거절 (Soft Delete 또는 Hard Delete, 여기서는 Hard Delete 유지)
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
    const member = profiles.find((p) => p.id === id)
    if (!member) return
    const currentRoleStr = getRoleLabel(member.role)
    const newRoleStr = getRoleLabel(newRole)
    
    if (!confirm(`정말 ${member.nickname}님의 역할을 [${currentRoleStr}]에서 [${newRoleStr}](으)로 변경하시겠습니까?`)) {
      // Re-trigger render to revert selected option
      setProfiles([...profiles])
      return
    }

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
    const member = profiles.find((p) => p.id === id)
    if (!member) return
    const actionText = currentExempt ? '일반 대상(면제 해제)' : '인증 면제 (러닝 인증)'
    
    if (!confirm(`정말 ${member.nickname}님을 [${actionText}](으)로 변경하시겠습니까?`)) return

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

  // 강퇴 처리 (Soft Delete: is_active = false)
  const handleKick = async (id: string, nickname: string) => {
    if (!confirm(`정말 ${nickname} 회원을 탈퇴/강퇴 처리하시겠습니까?\n(데이터는 보존되며 로그인만 차단됩니다.)`)) return
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
    } catch (err: any) {
      console.error('Failed to kick member:', err)
      alert('강퇴 처리 중 오류가 발생했습니다: ' + (err.message || JSON.stringify(err)))
    } finally {
      setActionInProgress(null)
    }
  }

  // 상태/메모 저장
  const handleSaveMemo = async () => {
    if (!editingProfile) return
    setActionInProgress('memo_saving')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status_text: statusText.trim() || null,
          admin_memo: adminMemo.trim() || null
        })
        .eq('id', editingProfile.id)

      if (error) throw error

      setProfiles((prev) =>
        prev.map((p) => (p.id === editingProfile.id ? { 
          ...p, 
          status_text: statusText.trim() || null, 
          admin_memo: adminMemo.trim() || null 
        } : p))
      )
      setEditingProfile(null)
    } catch (err) {
      console.error('Failed to save memo:', err)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  const openMemoModal = (profile: Profile) => {
    setEditingProfile(profile)
    setStatusText(profile.status_text || '')
    setAdminMemo(profile.admin_memo || '')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 상태/메모 수정 모달 */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in duration-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-950">관리자 메모</h2>
              <button
                onClick={() => setEditingProfile(null)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">상태 (부상, 출장 등)</label>
                <input
                  type="text"
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder="상태를 짧게 입력 (크루원들에게 노출됨)"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">관리자 특이사항 메모 (비공개)</label>
                <textarea
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  placeholder="관리자들만 볼 수 있는 메모를 입력하세요."
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleSaveMemo}
                disabled={actionInProgress === 'memo_saving'}
                className="mt-2 w-full py-3 rounded-2xl bg-[#CCFF00] border border-[#b8e600] text-gray-900 font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {actionInProgress === 'memo_saving' ? '저장 중...' : '저장 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. 승인 대기 회원 목록 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-950">가입 승인 대기</h2>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
              {waitingMembers.length}명
            </span>
          </div>
        </div>

        {waitingMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 text-xs">
            <p>대기 중인 회원이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {waitingMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{member.nickname}</span>
                    {member.phone && (
                      <span className="text-xs text-gray-500">{member.phone}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    가입 신청일: {new Date(member.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(member.id)}
                    disabled={actionInProgress === member.id}
                    className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-4 py-2 text-xs font-bold text-gray-900 transition-all active:scale-95 disabled:opacity-50"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleReject(member.id, member.nickname)}
                    disabled={actionInProgress === member.id}
                    className="rounded-2xl border border-red-200 bg-white hover:bg-red-50 text-red-600 px-4 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-950">크루원 관리</h2>
            <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-bold text-gray-700">
              {activeMembers.length}명
            </span>
          </div>

          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="닉네임 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-450 focus:border-gray-400 focus:outline-none transition-colors"
            />
            <svg className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {filteredActiveMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 text-xs">
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3 px-2">닉네임/상태</th>
                  <th className="pb-3 px-2">생존 (이번 달)</th>
                  <th className="pb-3 px-2">연락처/가입일</th>
                  <th className="pb-3 text-center px-2">인증 면제</th>
                  <th className="pb-3 px-2">역할</th>
                  <th className="pb-3 text-right px-2">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredActiveMembers.map((member) => {
                  const userRecords = records.filter(r => r.user_id === member.id)
                  const survival = calculateSurvival(userRecords, isRunningExempt(member))
                  const isUnderperforming = !survival.isSurvived && !isRunningExempt(member) && records.length > 0
                  
                  return (
                    <tr key={member.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-900">{member.nickname}</span>
                            {member.role === 'OWNER' && <span className="rounded bg-red-50 border border-red-100 px-1 py-[1px] text-[8px] font-bold text-red-600">크루장</span>}
                            {member.role === 'STAFF' && <span className="rounded bg-purple-50 border border-purple-100 px-1 py-[1px] text-[8px] font-bold text-purple-600">스태프</span>}
                            {member.role === 'PACER_LEADER' && <span className="rounded bg-teal-50 border border-teal-100 px-1 py-[1px] text-[8px] font-bold text-teal-600">페이서팀장</span>}
                            {member.role === 'PACER' && <span className="rounded bg-emerald-50 border border-emerald-100 px-1 py-[1px] text-[8px] font-bold text-emerald-600">페이서</span>}
                            {member.role === 'ADMIN' && <span className="rounded bg-purple-50 border border-purple-100 px-1 py-[1px] text-[8px] font-bold text-purple-600">스태프</span>}
                          </div>
                          {(member.status_text || member.admin_memo) && (
                            <div className="flex gap-1">
                              {member.status_text && <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">{member.status_text}</span>}
                              {member.admin_memo && <span className="text-[9px] text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">메모: {member.admin_memo}</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold ${isUnderperforming ? 'text-red-650 font-extrabold' : 'text-emerald-600'}`}>
                            {survival.statusText}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {survival.progressPercent}% ({survival.totalDays}회 달성)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-gray-700">{member.phone || '-'}</span>
                          <span className="text-[9px] text-gray-400">{new Date(member.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <button
                          onClick={() => handleExemptToggle(member.id, member.is_exempted)}
                          disabled={actionInProgress === member.id}
                          className={`
                            inline-flex items-center justify-center rounded-2xl border px-2.5 py-1 text-[10px] font-bold
                            transition-all duration-200 active:scale-[0.95] disabled:opacity-50
                            ${
                              isRunningExempt(member)
                                ? 'border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100'
                                : 'border-gray-205 bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }
                          `}
                        >
                          {member.is_exempted ? '인증 면제됨' : '인증 면제'}
                        </button>
                      </td>
                      <td className="py-3.5 px-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as Profile['role'])}
                          disabled={actionInProgress === member.id}
                          className="rounded-2xl border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-900 focus:border-gray-400 focus:outline-none transition-colors disabled:opacity-50"
                        >
                          <option value="OWNER">크루장</option>
                          <option value="STAFF">스태프</option>
                          <option value="PACER_LEADER">페이서팀장</option>
                          <option value="PACER">페이서</option>
                          <option value="REGULAR">일반 크루원</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openMemoModal(member)}
                            className="rounded-2xl border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-gray-550 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-95"
                          >
                            메모
                          </button>
                          <button
                            onClick={() => handleKick(member.id, member.nickname)}
                            disabled={actionInProgress === member.id}
                            className="rounded-2xl border border-red-200 bg-white px-2.5 py-1 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 transition-all disabled:opacity-50 active:scale-95"
                          >
                            강퇴
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
