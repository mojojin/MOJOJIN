'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { checkHiddenCardBonus } from '@/utils/challengeRules'

interface ChallengeTeamCardProps {
  userId: string
}

interface TeamInfo {
  id: string
  name: string
  color: string
  intro?: string
  insta_url?: string
  insta_verified?: boolean
  chat_url?: string
}

interface MemberStatus {
  user_id: string
  nickname: string
  port_group: number
  is_captain: boolean
  run_count: number
}

/**
 * 12월 원팀 챌린지 모바일 전용 위젯
 * - 소속 팀 점수 & 150점 컷오프 게이지
 * - 팀 오픈채팅방 바로가기 링크 등록 및 접속
 * - 인스타 피드 링크 등록
 * - 🃏 히든 카드 (전원 3회 완주 시 최고점 x3배) 달성 현황
 */
export default function ChallengeTeamCard({ userId }: { userId: string }) {
  const supabase = createClient() as any
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [members, setMembers] = useState<MemberStatus[]>([])
  const [teamTotalPoints, setTeamTotalPoints] = useState<number>(0)
  const [instaInput, setInstaInput] = useState<string>('')
  const [chatInput, setChatInput] = useState<string>('')
  const [isEditingChat, setIsEditingChat] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [hiddenCardStatus, setHiddenCardStatus] = useState<{ isEligible: boolean; currentQualified: number; total: number; bonusPoints: number }>({
    isEligible: false,
    currentQualified: 0,
    total: 0,
    bonusPoints: 0,
  })

  useEffect(() => {
    let alive = true

    async function loadTeamData() {
      try {
        // 1. 내 소속 팀 조회
        const { data: myMapping } = await supabase
          .from('challenge_team_members')
          .select('team_id, is_captain')
          .eq('user_id', userId)
          .maybeSingle()

        if (!myMapping?.team_id) {
          if (alive) setLoading(false)
          return
        }

        // 2. 팀 정보 조회
        const { data: teamData } = await supabase
          .from('challenge_teams')
          .select('*')
          .eq('id', myMapping.team_id)
          .single()

        // 3. 팀원 목록 조회
        const { data: memberList } = await supabase
          .from('challenge_team_members')
          .select('user_id, port_group, is_captain, profiles(nickname)')
          .eq('team_id', myMapping.team_id)

        // 4. 누적 점수 조회
        const { data: scoreLogs } = await supabase
          .from('challenge_score_logs')
          .select('points, rule_type, user_id')
          .eq('team_id', myMapping.team_id)

        const total = (scoreLogs || []).reduce((acc: number, cur: any) => acc + (cur.points || 0), 0)

        // 5. 팀원별 12월 인증 횟수 집계 (히든 카드 체크용)
        const runCounts: Record<string, number> = {}
        const { data: runs } = await supabase
          .from('running_records')
          .select('user_id')
          .in('user_id', (memberList || []).map((m: any) => m.user_id))

        ;(runs || []).forEach((r: any) => {
          runCounts[r.user_id] = (runCounts[r.user_id] || 0) + 1
        })

        if (alive && teamData) {
          setTeam(teamData)
          setTeamTotalPoints(total)
          setInstaInput(teamData.insta_url || '')
          setChatInput(teamData.chat_url || '')

          const formattedMembers: MemberStatus[] = (memberList || []).map((m: any) => ({
            user_id: m.user_id,
            nickname: m.profiles?.nickname || '러너',
            port_group: m.port_group,
            is_captain: m.is_captain,
            run_count: runCounts[m.user_id] || 0,
          }))
          setMembers(formattedMembers)

          // 히든카드 자격 계산
          const totalMembers = formattedMembers.length
          const qualifiedCount = formattedMembers.filter((m) => m.run_count >= 3).length
          const hiddenRes = checkHiddenCardBonus(totalMembers, runCounts, scoreLogs || [])

          setHiddenCardStatus({
            isEligible: hiddenRes.isEligible,
            currentQualified: qualifiedCount,
            total: totalMembers,
            bonusPoints: hiddenRes.bonusPoints,
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadTeamData()
    return () => { alive = false }
  }, [userId])

  if (loading || !team) return null

  const progressPercent = Math.min(100, Math.round((teamTotalPoints / 150) * 100))

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 animate-in fade-in">
      {/* 팀 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black bg-gray-950 text-white px-2 py-0.5 rounded-md">
                12월 원팀 챌린지
              </span>
              <span className="text-xs font-extrabold text-gray-900">{team.name}</span>
            </div>
            {team.intro && <p className="text-[11px] text-gray-500 mt-0.5">{team.intro}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 font-bold">우리 팀 점수</div>
          <div className="text-lg font-black text-gray-950">{teamTotalPoints}점</div>
        </div>
      </div>

      {/* 팀 단톡방 바로가기 배너 */}
      <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <div>
            <div className="text-xs font-extrabold text-gray-900">우리 팀 단톡방</div>
            <p className="text-[10px] text-gray-500">팀원들과 벙 일정 잡고 소통하기</p>
          </div>
        </div>
        {team.chat_url ? (
          <a
            href={team.chat_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#FEE500] text-gray-950 text-xs font-black hover:bg-[#ebd300] active:scale-95 transition shadow-sm"
          >
            입장하기 ↗
          </a>
        ) : (
          <button
            onClick={() => setIsEditingChat(true)}
            className="px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 text-[11px] font-bold active:scale-95 transition"
          >
            방 링크 등록 +
          </button>
        )}
      </div>

      {/* 단톡방 링크 입력창 토글 */}
      {isEditingChat && (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
          <span className="text-[11px] font-bold text-gray-700">팀 카카오톡 오픈채팅방 링크 등록:</span>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://open.kakao.com/o/..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 outline-none"
            />
            <button
              onClick={async () => {
                if (!chatInput.trim()) return alert('채팅방 링크를 입력해주세요.')
                await supabase.from('challenge_teams').update({ chat_url: chatInput.trim() }).eq('id', team.id)
                setTeam({ ...team, chat_url: chatInput.trim() })
                setIsEditingChat(false)
                alert('팀 단톡방 링크가 등록되었습니다!')
              }}
              className="px-3 py-1.5 rounded-xl bg-gray-950 text-white text-xs font-bold shrink-0"
            >
              저장
            </button>
            <button
              onClick={() => setIsEditingChat(false)}
              className="px-2 py-1.5 text-xs text-gray-500 font-bold"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 150점 컷오프 게이지 바 */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-gray-500">시상 자격 컷오프 (150점)</span>
          <span className="text-gray-900">{progressPercent}% 달성</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#CCFF00] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 🃏 히든 카드 역전 찬스 (전원 3회 이상 출석 시 최고점 x3배) */}
      <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1">
            <span>🃏</span> 히든 역전 치트키 (최고점 x3배)
          </span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
            hiddenCardStatus.isEligible ? 'bg-purple-600 text-white animate-pulse' : 'bg-purple-100 text-purple-800'
          }`}>
            {hiddenCardStatus.isEligible ? '해금 완료! ⚡' : `${hiddenCardStatus.currentQualified}/${hiddenCardStatus.total}명 완료`}
          </span>
        </div>
        <p className="text-[10px] text-purple-800 leading-relaxed">
          팀원 전원이 각자 3회 이상 달리면, 우리 팀의 단일 최고점수(완전체 50점 등)에 <strong>×3배</strong>를 곱해주는 초대형 역전 보너스가 터집니다!
        </p>
      </div>

      {/* 팀원 현황 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
          <span>팀원 출석 현황 ({members.length}명)</span>
          <span className="text-[10px] text-gray-400">인증 3회 이상 시 히든카드 기여</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span className={`text-[9px] font-black px-1 py-0.2 rounded ${
                  m.port_group === 1 ? 'bg-red-100 text-red-700' :
                  m.port_group === 2 ? 'bg-orange-100 text-orange-700' :
                  m.port_group === 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  P{m.port_group}
                </span>
                <span className="font-bold text-gray-900 truncate">{m.nickname}</span>
                {m.is_captain && <span className="text-[9px] text-amber-600 font-extrabold">👑</span>}
              </div>
              <div className="font-mono text-[10px] text-gray-500 shrink-0">
                {m.run_count >= 3 ? (
                  <span className="text-purple-600 font-bold">{m.run_count}회 ✓</span>
                ) : (
                  <span>{m.run_count}/3회</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 인스타 피드 미션 링크 등록 */}
      <div className="rounded-xl border border-dashed border-gray-200 p-3 bg-gray-50/50 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-900">📸 팀 소개 인스타 피드 링크 (+10점)</span>
          {team.insta_verified ? (
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              인증완료 ✓
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              인증대기
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="인스타그램 게시물 URL 붙여넣기"
            value={instaInput}
            onChange={(e) => setInstaInput(e.target.value)}
            disabled={team.insta_verified}
            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none"
          />
          {!team.insta_verified && (
            <button
              onClick={async () => {
                if (!instaInput.trim()) return alert('URL을 입력해주세요.')
                await supabase
                  .from('challenge_teams')
                  .update({ insta_url: instaInput.trim() })
                  .eq('id', team.id)
                alert('팀 소개 인스타 링크가 등록되었습니다! 운영진 확인 후 +10점이 반영됩니다.')
              }}
              className="px-3 py-1.5 rounded-xl bg-gray-950 text-white text-xs font-bold shrink-0"
            >
              제출
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
