'use client'

import { useState, useMemo } from 'react'
import { generateSnakeDraftTeams, DraftTeam } from '@/utils/challengeDraft'
import { evaluateRunningPoints } from '@/utils/challengeRules'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface Props {
  profiles: Profile[]
  records: RunningRecord[]
}

export default function ChallengeSimulatorTab({ profiles, records }: Props) {
  const [teamSize, setTeamSize] = useState<number>(15)
  const [teams, setTeams] = useState<DraftTeam[]>([])
  const [backtestLogs, setBacktestLogs] = useState<string[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  // 1. 제외 회원 & 활성 회원 통계
  const stats = useMemo(() => {
    const total = profiles.length
    const exempted = profiles.filter((p) => p.is_exempted).length
    const inactive = profiles.filter((p) => !p.is_active || p.role === 'WAITING').length
    const eligible = profiles.filter((p) => !p.is_exempted && p.is_active && p.role !== 'WAITING').length
    const calculatedTeams = Math.max(1, Math.floor(eligible / teamSize))
    const remainder = eligible % teamSize
    return { total, exempted, inactive, eligible, calculatedTeams, remainder }
  }, [profiles, teamSize])

  // 2. 4포트 스네이크 드래프트 실행 (15명 기준 + 깍두기 분배)
  const handleDraft = () => {
    const drafted = generateSnakeDraftTeams(profiles, records, teamSize)
    setTeams(drafted)
  }

  // 3. 지난 러닝 기록 기반 점수 백테스트 실행
  const handleBacktest = () => {
    if (teams.length === 0) {
      alert('먼저 팀 드래프트를 실행해주세요.')
      return
    }

    setIsSimulating(true)
    const logs: string[] = []
    logs.push(`🏁 총 ${records.length}건의 실제 러닝 기록으로 12월 챌린지 점수 백테스트 시작...`)

    // 회원별 소속 팀 맵
    const userTeamMap: Record<string, string> = {}
    teams.forEach((t) => {
      t.members.forEach((m) => {
        userTeamMap[m.user_id] = t.id
      })
    })

    const teamScores: Record<string, { totalPoints: number; runCount: number; details: Record<string, number> }> = {}
    teams.forEach((t) => {
      teamScores[t.id] = { totalPoints: 0, runCount: 0, details: {} }
    })

    let simulatedCount = 0
    records.slice(0, 150).forEach((rec) => {
      const teamId = userTeamMap[rec.user_id]
      if (!teamId) return

      simulatedCount++
      const points = evaluateRunningPoints({
        userId: rec.user_id,
        distance: Number(rec.distance || 0),
        runDate: rec.running_date || '2026-10-01',
        runTime: rec.created_at ? new Date(rec.created_at).toTimeString().slice(0, 5) : '07:30',
        sameLocationRunnersToday: [{ userId: rec.user_id, teamId }],
      })

      points.forEach((p) => {
        teamScores[teamId].totalPoints += p.points
        teamScores[teamId].details[p.rule_type] = (teamScores[teamId].details[p.rule_type] || 0) + 1
      })
      teamScores[teamId].runCount++
    })

    logs.push(`✅ 150건 샘플 인증 검증 완료! (유효 인증: ${simulatedCount}건)`)
    teams.forEach((t) => {
      const res = teamScores[t.id]
      logs.push(`📊 [${t.name}] 누적 가상 점수: ${res.totalPoints}점 (인증 ${res.runCount}건)`)
    })

    setBacktestLogs(logs)
    setIsSimulating(false)
  }

  return (
    <div className="space-y-6">
      {/* 상단 안내 카드 */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧪</span>
          <h3 className="text-sm font-extrabold text-blue-950">12월 원팀 챌린지 비공개 시뮬레이터</h3>
        </div>
        <p className="text-xs text-blue-800 mt-1.5 leading-relaxed">
          11월 개발 및 검증 전용 화면입니다. 일반 회원에게는 노출되지 않으며, 부상자 제외 확인 및 4포트 스네이크 드래프트 밸런스를 사전 테스트할 수 있습니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="bg-white/80 px-2.5 py-1 rounded-xl text-gray-700">전체 회원: {stats.total}명</span>
          <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-xl">면제/부상자 제외: {stats.exempted}명</span>
          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl">추첨 대상(액티브): {stats.eligible}명</span>
          <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-xl">
            예상 편성: {stats.calculatedTeams}개 팀 (각 {teamSize}명) + 깍두기 {stats.remainder}명
          </span>
        </div>
      </div>

      {/* 설정 및 액션 바 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">팀당 기본 정원:</span>
            <select
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="text-xs font-extrabold border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 text-gray-900"
            >
              <option value={10}>10명씩</option>
              <option value={12}>12명씩</option>
              <option value={15}>15명씩 (권장)</option>
              <option value={16}>16명씩</option>
              <option value={18}>18명씩</option>
            </select>
            <span className="text-[11px] text-gray-400">
              (15명 정원 초과 인원은 깍두기로 균등 분배)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDraft}
              className="px-4 py-2 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-gray-800 active:scale-95 transition"
            >
              🎲 15명 기준 스네이크 드래프트 실행
            </button>
            {teams.length > 0 && (
              <button
                onClick={handleBacktest}
                disabled={isSimulating}
                className="px-4 py-2 rounded-xl bg-[#CCFF00] border border-[#b8e600] text-gray-950 text-xs font-bold active:scale-95 transition"
              >
                {isSimulating ? '검증 중...' : '⚡ 실 러닝 데이터 점수 백테스트'}
              </button>
            )}
          </div>
        </div>

        {/* 백테스트 로그 콘솔 */}
        {backtestLogs.length > 0 && (
          <div className="rounded-xl bg-gray-950 p-3.5 font-mono text-[11px] text-green-400 space-y-1 max-h-48 overflow-y-auto">
            {backtestLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}
      </div>

      {/* 팀 배정 결과 프리뷰 */}
      {teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => {
            const totalScore = Math.round(team.members.reduce((a, b) => a + b.score, 0))
            const avgDist = Math.round((team.members.reduce((a, b) => a + b.total_distance, 0) / (team.members.length || 1)) * 10) / 10
            const bonusPicks = team.members.filter((m) => m.is_bonus_pick).length

            return (
              <div key={team.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: team.color }} />
                    <h4 className="text-sm font-extrabold text-gray-950">{team.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-gray-700">
                      인원 {team.members.length}명
                    </span>
                    {bonusPicks > 0 && (
                      <span className="ml-1 text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        깍두기 +{bonusPicks}
                      </span>
                    )}
                    <div className="text-[10px] text-gray-400">평균 {avgDist}km</div>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {team.members.map((m) => (
                    <div key={m.user_id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          m.port_group === 1 ? 'bg-red-100 text-red-700' :
                          m.port_group === 2 ? 'bg-orange-100 text-orange-700' :
                          m.port_group === 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          포트{m.port_group}
                        </span>
                        <span className="font-bold text-gray-900">{m.nickname}</span>
                        {m.is_bonus_pick && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-100/70 px-1 py-0.2 rounded">
                            깍두기
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {m.total_distance}km / {m.run_count}회
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500">팀 밸런스 지수:</span>
                  <span className="font-black text-gray-900">{totalScore}점</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
