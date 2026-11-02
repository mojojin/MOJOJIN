'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
}

interface MemberStatus {
  user_id: string
  nickname: string
  port_group: number
  is_captain: boolean
  week_run_count: number
  total_distance: number
}

/**
 * 12월 원팀 챌린지 모바일 전용 위젯
 * - 현재는 비공개 테스트 모드이며, challenge_team_members에 소속된 회원에게만 조용히 렌더링되거나
 *   관리자 미리보기 모드로만 동작합니다.
 */
export default function ChallengeTeamCard({ userId }: { userId: string }) {
  const supabase = createClient() as any
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [members, setMembers] = useState<MemberStatus[]>([])
  const [teamTotalPoints, setTeamTotalPoints] = useState<number>(0)
  const [instaInput, setInstaInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

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
          .select('points')
          .eq('team_id', myMapping.team_id)

        const total = (scoreLogs || []).reduce((acc: number, cur: any) => acc + (cur.points || 0), 0)

        if (alive && teamData) {
          setTeam(teamData)
          setTeamTotalPoints(total)
          setInstaInput(teamData.insta_url || '')

          const formattedMembers: MemberStatus[] = (memberList || []).map((m: any) => ({
            user_id: m.user_id,
            nickname: m.profiles?.nickname || '러너',
            port_group: m.port_group,
            is_captain: m.is_captain,
            week_run_count: 0,
            total_distance: 0,
          }))
          setMembers(formattedMembers)
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

  // 시상 자격 기준선 150점 게이지 퍼센트
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

      {/* 팀원 현황 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
          <span>팀원 현황 ({members.length}명)</span>
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
            </div>
          ))}
        </div>
      </div>

      {/* 인스타 피드 미션 링크 등록 (팀장 또는 팀원) */}
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
