import { createClient } from '@/lib/supabase/client'
import { evaluateRunningPoints, PointRuleResult } from './challengeRules'

interface ProcessRunParams {
  userId: string
  recordId?: string
  distance: number
  runDate: string // YYYY-MM-DD
  locationId?: string | null
  isScheduledRun?: boolean
  isHost?: boolean
}

/**
 * 러닝 인증 완료 시 챌린지 점수 자동 적립 파이프라인
 * - 12월 이벤트 기간(2026-12-01 ~ 2026-12-31) 내 기록이거나,
 *   시스템에 등록된 챌린지 팀 멤버일 경우에만 작동합니다.
 * - 실패하더라도 기본 인증 플로우를 방해하지 않도록 에러는 안전하게 catch 처리합니다.
 */
export async function processChallengePointsForRecord(
  params: ProcessRunParams
): Promise<PointRuleResult[]> {
  try {
    const supabase = createClient() as any

    // 1. 해당 유저의 챌린지 팀 소속 여부 확인
    const { data: memberData } = await supabase
      .from('challenge_team_members')
      .select('team_id')
      .eq('user_id', params.userId)
      .maybeSingle()

    if (!memberData?.team_id) {
      // 아직 팀에 소속되지 않았거나 챌린지 미참여자는 통과
      return []
    }

    const teamId = memberData.team_id

    // 2. 오늘 이 유저가 이미 적립받은 챌린지 기본 점수가 있는지 확인
    const { data: todayLogs } = await supabase
      .from('challenge_score_logs')
      .select('id, rule_type')
      .eq('user_id', params.userId)
      .eq('earned_date', params.runDate)

    const alreadyScoredToday = Boolean(
      todayLogs &&
        todayLogs.some((l: any) =>
          ['BASE_RUN', 'DISTANCE_CAP'].includes(l.rule_type)
        )
    )

    // 3. 같은 날, 같은 장소에서 달린 다른 러너들 조회 (3인 벙 / 크로스런 판별)
    let sameLocationRunnersToday: { userId: string; teamId?: string }[] = []
    if (params.locationId) {
      const { data: sameRuns } = await supabase
        .from('running_records')
        .select('user_id')
        .eq('run_date', params.runDate)
        .eq('location_id', params.locationId)

      if (sameRuns && sameRuns.length > 0) {
        const userIds = Array.from(new Set(sameRuns.map((r: any) => r.user_id)))
        // 이 유저들의 팀 매핑 정보 조회
        const { data: teamMappings } = await supabase
          .from('challenge_team_members')
          .select('user_id, team_id')
          .in('user_id', userIds)

        const teamMap = new Map((teamMappings || []).map((m: any) => [m.user_id, m.team_id]))
        sameLocationRunnersToday = userIds.map((uid) => ({
          userId: uid as string,
          teamId: teamMap.get(uid) as string | undefined,
        }))
      }
    }

    // 4. 우리 팀 전체 팀원 ID 목록 조회 (완전체 100% 런 판별)
    const { data: teamMembers } = await supabase
      .from('challenge_team_members')
      .select('user_id')
      .eq('team_id', teamId)

    const myTeamMemberIds = (teamMembers || []).map((m: any) => m.user_id as string)

    // 5. 룰 엔진 평가
    const points = evaluateRunningPoints({
      userId: params.userId,
      distance: params.distance,
      runDate: params.runDate,
      runTime: new Date().toTimeString().slice(0, 8),
      locationId: params.locationId || undefined,
      isScheduledRun: params.isScheduledRun,
      isHost: params.isHost,
      sameLocationRunnersToday,
      alreadyScoredToday,
      myTeamMemberIds,
    })

    if (points.length === 0) {
      return []
    }

    // 6. DB 점수 로그 테이블에 일괄 적립
    const inserts = points.map((p) => ({
      team_id: teamId,
      user_id: params.userId,
      record_id: params.recordId || null,
      rule_type: p.rule_type,
      points: p.points,
      description: p.description,
      earned_date: params.runDate,
    }))

    await supabase.from('challenge_score_logs').insert(inserts)

    return points
  } catch (err) {
    // 챌린지 점수 계산 중 문제가 생겨도 본래 러닝 인증에는 지장이 없도록 함
    console.error('Challenge points auto-calc error:', err)
    return []
  }
}
