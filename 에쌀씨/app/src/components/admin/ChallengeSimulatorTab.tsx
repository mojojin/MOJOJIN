'use client'

import { useState, useMemo, useEffect } from 'react'
import { generateSnakeDraftTeams, DraftTeam } from '@/utils/challengeDraft'
import { evaluateRunningPoints } from '@/utils/challengeRules'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface Props {
  profiles: Profile[]
  records: RunningRecord[]
}

export default function ChallengeSimulatorTab({ profiles, records }: Props) {
  const supabase = createClient() as any
  const [teamSize, setTeamSize] = useState<number>(15)
  const [teams, setTeams] = useState<DraftTeam[]>([])
  const [backtestLogs, setBacktestLogs] = useState<string[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [dbSavedTeamCount, setDbSavedTeamCount] = useState<number>(0)
  const [pendingInstaTeams, setPendingInstaTeams] = useState<any[]>([])
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false)

  // DB에 저장된 팀 & 인스타 미션 제출 건 불러오기
  const fetchDbChallengeStatus = async () => {
    try {
      const { data: dbTeams } = await supabase.from('challenge_teams').select('id, name, insta_url, insta_verified')
      if (dbTeams) {
        setDbSavedTeamCount(dbTeams.length)
        const pending = dbTeams.filter((t: any) => t.insta_url && !t.insta_verified)
        setPendingInstaTeams(pending)
      }
    } catch (e) {
      // 테이블 미생성 시 조용히 무시
    }
  }

  useEffect(() => {
    fetchDbChallengeStatus()
  }, [])

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

  // 3. 카카오톡/단톡방 공유용 텍스트 복사 핸들러
  const handleCopyKakaoText = async () => {
    if (teams.length === 0) return alert('먼저 드래프트를 실행해주세요.')
    
    let text = `🔥 [SRC 12월 원팀 챌린지 팀 편성표]\n총 ${teams.length}개 팀 / ${stats.eligible}명 배정 완료\n\n`
    teams.forEach((t, idx) => {
      text += `📍 ${t.name} (${t.members.length}명)\n`
      const cap = t.members[0]?.nickname || '미정'
      text += `👑 임시 팀장: ${cap}\n`
      text += `🏃 팀원: ` + t.members.map((m) => m.nickname + (m.is_bonus_pick ? '(깍두기)' : '')).join(', ') + '\n\n'
    })
    text += `❄️ 12월 1일부터 공식 시작됩니다! 팀원들과 함께 달려보세요! 🙌`

    try {
      await navigator.clipboard.writeText(text)
      alert('📋 단톡방 공지용 팀 편성 텍스트가 클립보드에 복사되었습니다!\n카톡방에 바로 붙여넣기(Ctrl+V) 하시면 됩니다.')
    } catch (e) {
      alert('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  // 개별 팀 멤버 복사
  const handleCopySingleTeam = async (t: DraftTeam) => {
    const names = t.members.map((m) => m.nickname + (m.is_bonus_pick ? '(깍두기)' : '')).join(', ')
    const text = `[${t.name}] 팀원 명단 (${t.members.length}명):\n${names}`
    try {
      await navigator.clipboard.writeText(text)
      alert(`📋 [${t.name}] 팀원 명단이 복사되었습니다!`)
    } catch (e) {
      alert('복사에 실패했습니다.')
    }
  }

  // 4. 지난 러닝 기록 기반 점수 백테스트 실행
  const handleBacktest = () => {
    if (teams.length === 0) {
      alert('먼저 팀 드래프트를 실행해주세요.')
      return
    }

    setIsSimulating(true)
    const logs: string[] = []
    logs.push(`🏁 총 ${records.length}건의 실제 러닝 기록으로 12월 챌린지 점수 백테스트 시작...`)

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
        isScheduledRun: rec.run_type === 'REGULAR',
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

  // 5. 드래프트 결과를 공식 DB에 확정 저장 (12월 런칭 준비)
  const handleSaveTeamsToDb = async () => {
    if (teams.length === 0) return alert('저장할 팀 편성 결과가 없습니다. 먼저 드래프트를 실행해주세요.')
    if (!confirm(`총 ${teams.length}개 팀의 편성을 공식 DB에 저장하시겠습니까?\n(기존 챌린지 팀 및 소속 데이터는 새로 갱신됩니다)`)) return

    setIsSaving(true)
    try {
      await supabase.from('challenge_teams').delete().neq('name', '___')

      for (const t of teams) {
        const { data: createdTeam, error: teamErr } = await supabase
          .from('challenge_teams')
          .insert({
            name: t.name,
            color: t.color,
          })
          .select('id')
          .single()

        if (teamErr) throw teamErr

        const memberInserts = t.members.map((m, idx) => ({
          team_id: createdTeam.id,
          user_id: m.user_id,
          port_group: m.port_group,
          is_captain: idx === 0,
        }))

        const { error: memErr } = await supabase.from('challenge_team_members').insert(memberInserts)
        if (memErr) throw memErr
      }

      alert('🎉 12월 원팀 챌린지 팀 편성이 DB에 안전하게 확정 저장되었습니다!')
      fetchDbChallengeStatus()
    } catch (err: any) {
      alert('저장 실패: ' + (err.message || 'Supabase 테이블 생성 여부를 확인해주세요.'))
    } finally {
      setIsSaving(false)
    }
  }

  // 6. 인스타 소개 미션 1-Click 승인 (+10점)
  const handleApproveInsta = async (team: any) => {
    if (!confirm(`[${team.name}]의 인스타그램 소개 피드 미션을 승인하고 +10점을 부여하시겠습니까?`)) return
    try {
      await supabase.from('challenge_teams').update({ insta_verified: true }).eq('id', team.id)
      await supabase.from('challenge_score_logs').insert({
        team_id: team.id,
        rule_type: 'INSTA_MISSION',
        points: 10,
        description: '팀 소개 인스타그램 피드 업로드 미션 완료 (+10점)',
        earned_date: new Date().toISOString().slice(0, 10),
      })
      alert(`🎉 [${team.name}] 인스타 미션이 승인되어 팀 점수 +10점이 반영되었습니다!`)
      fetchDbChallengeStatus()
    } catch (e: any) {
      alert('승인 처리 실패: ' + e.message)
    }
  }

  // Supabase SQL 복사
  const challengeSqlCode = `-- 12월 원팀 챌린지 DB 생성 SQL
CREATE TABLE IF NOT EXISTS public.challenge_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  intro TEXT,
  insta_url TEXT,
  insta_verified BOOLEAN NOT NULL DEFAULT FALSE,
  color TEXT DEFAULT '#CCFF00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  port_group INT NOT NULL DEFAULT 3,
  is_captain BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.challenge_score_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  record_id UUID REFERENCES public.running_records(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  points INT NOT NULL,
  description TEXT,
  earned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_score_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenge_teams_select" ON public.challenge_teams;
CREATE POLICY "challenge_teams_select" ON public.challenge_teams FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "challenge_team_members_select" ON public.challenge_team_members;
CREATE POLICY "challenge_team_members_select" ON public.challenge_team_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "challenge_score_logs_select" ON public.challenge_score_logs;
CREATE POLICY "challenge_score_logs_select" ON public.challenge_score_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "challenge_admin_manage_teams" ON public.challenge_teams;
CREATE POLICY "challenge_admin_manage_teams" ON public.challenge_teams FOR ALL TO authenticated
  USING (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'))
  WITH CHECK (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'));

DROP POLICY IF EXISTS "challenge_admin_manage_members" ON public.challenge_team_members;
CREATE POLICY "challenge_admin_manage_members" ON public.challenge_team_members FOR ALL TO authenticated
  USING (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'))
  WITH CHECK (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'));

DROP POLICY IF EXISTS "challenge_admin_manage_scores" ON public.challenge_score_logs;
CREATE POLICY "challenge_admin_manage_scores" ON public.challenge_score_logs FOR ALL TO authenticated
  USING (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'))
  WITH CHECK (public.get_my_role()::text IN ('ADMIN', 'OWNER', 'STAFF'));`

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(challengeSqlCode)
      alert('📋 Supabase 생성 SQL이 복사되었습니다!\nSupabase SQL Editor에 붙여넣고 Run 해주세요.')
    } catch (e) {
      alert('복사에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      {/* 상단 안내 카드 */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧪</span>
            <h3 className="text-sm font-extrabold text-blue-950">12월 원팀 챌린지 비공개 관리 센터</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="text-[11px] font-extrabold text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 active:scale-95 transition flex items-center gap-1 shadow-sm"
            >
              <span>📋</span> Supabase SQL 복사
            </button>
            {dbSavedTeamCount > 0 ? (
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-xl">
                DB 확정 완료: {dbSavedTeamCount}개 팀
              </span>
            ) : (
              <span className="text-[11px] font-bold text-gray-500 bg-white/80 px-2.5 py-1.5 rounded-xl">
                DB 미확정 (드래프트 대기)
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-blue-800 mt-1.5 leading-relaxed">
          11월 개발 및 검증 전용 화면입니다. 일반 회원에게는 노출되지 않으며, 부상자 제외 확인 및 15명 정원 4포트 스네이크 드래프트 밸런스를 사전 테스트할 수 있습니다.
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

      {/* 인스타 미션 검수 대기 카드 (있을 경우에만 노출) */}
      {pendingInstaTeams.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
              <span>📸</span> 인스타그램 팀 소개 미션 승인 대기 ({pendingInstaTeams.length}건)
            </h4>
            <span className="text-[10px] text-amber-700 font-bold">승인 시 팀 점수 +10점 자동 지급</span>
          </div>
          <div className="space-y-2">
            {pendingInstaTeams.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200 text-xs">
                <div>
                  <span className="font-extrabold text-gray-900">{t.name}</span>
                  <a
                    href={t.insta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-[11px] text-blue-600 underline font-mono"
                  >
                    피드 링크 열기 ↗
                  </a>
                </div>
                <button
                  onClick={() => handleApproveInsta(t)}
                  className="px-3 py-1.5 rounded-lg bg-[#CCFF00] border border-[#b8e600] text-gray-950 font-extrabold text-[11px] active:scale-95 transition"
                >
                  승인 (+10점)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDraft}
              className="px-4 py-2 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-gray-800 active:scale-95 transition"
            >
              🎲 15명 기준 스네이크 드래프트 실행
            </button>
            {teams.length > 0 && (
              <>
                <button
                  onClick={handleCopyKakaoText}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-gray-950 text-xs font-extrabold hover:bg-amber-500 active:scale-95 transition flex items-center gap-1 shadow-sm"
                >
                  <span>📋</span> 단톡방 공지 양식 전체 복사
                </button>
                <button
                  onClick={handleBacktest}
                  disabled={isSimulating}
                  className="px-4 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-200 active:scale-95 transition"
                >
                  {isSimulating ? '검증 중...' : '⚡ 과거 데이터 점수 백테스트'}
                </button>
                <button
                  onClick={handleSaveTeamsToDb}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#CCFF00] border border-[#b8e600] text-gray-950 text-xs font-black shadow-sm active:scale-95 transition"
                >
                  {isSaving ? 'DB 저장 중...' : '💾 이 편성 결과 DB에 공식 확정 저장'}
                </button>
              </>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopySingleTeam(team)}
                      className="text-[10px] font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2 py-0.5 bg-gray-50 hover:bg-gray-100 active:scale-95 transition"
                    >
                      명단 복사 📋
                    </button>
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
