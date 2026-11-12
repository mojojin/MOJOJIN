/**
 * 12월 원팀 챌린지 점수 계산 엔진 (업데이트)
 * 1. 정기런 최우선: +5점
 * 2. 5인 이상 벙: +3점 (5인 미만은 벙 점수 없음, 참여 극대화)
 * 3. 5인 이상 벙 벙주: +2점
 * 4. 팀 완전체 벙: +50점 (대회 최고점)
 * 5. 개인 런 거리 캡: 3~4.9km (+1점) / 5km 이상 (+2점)
 * 6. 새벽런: +1점
 * 7. 타팀 크로스런: +2점
 * 8. 히든 카드: 전원 3회 이상 인증 시 최고 단일 득점 x3배
 */

export interface PointRuleResult {
  rule_type: string
  points: number
  description: string
}

interface RunValidationContext {
  userId: string
  distance: number
  runDate: string // YYYY-MM-DD
  runTime?: string // HH:mm:ss
  locationId?: string
  isScheduledRun?: boolean // 정기런 여부
  isHost?: boolean // 벙 개설자(호스트) 여부
  // 동시간/동일장소 같은 날 뛴 전체 러너들 목록
  sameLocationRunnersToday?: { userId: string; teamId?: string }[]
  // 이미 오늘 이 유저가 획득한 기본 점수가 있는지
  alreadyScoredToday?: boolean
  // 유저의 팀 소속 전체 팀원 ID 목록
  myTeamMemberIds?: string[]
}

export function evaluateRunningPoints(ctx: RunValidationContext): PointRuleResult[] {
  const results: PointRuleResult[] = []

  // 1. 최소 거리 3km 미만은 챌린지 점수 없음
  if (ctx.distance < 3.0) {
    return results
  }

  // 2. 개인 런 기본 점수 (1일 1회 한정)
  if (!ctx.alreadyScoredToday) {
    if (ctx.distance >= 5.0) {
      results.push({
        rule_type: 'DISTANCE_CAP',
        points: 2,
        description: '5km 이상 완주 (+2점)',
      })
    } else {
      results.push({
        rule_type: 'BASE_RUN',
        points: 1,
        description: '3km 이상 기본 완주 (+1점)',
      })
    }
  }

  // 3. 🥇 정기런(공식 런) 최우선 최고 배점 (+5점)
  if (ctx.isScheduledRun) {
    results.push({
      rule_type: 'REGULAR_RUN',
      points: 5,
      description: '🥇 SRC 공식 정기런 참여 최고 보너스 (+5점)',
    })
  }

  // 4. 🔥 5인 이상 벙 동반런 (+3점) - 5인 미만은 벙 점수 없음 (다수 참여 유도)
  const groupCount = ctx.sameLocationRunnersToday?.length || 0
  if (groupCount >= 5) {
    results.push({
      rule_type: 'GATHERING_5PLUS',
      points: 3,
      description: `🔥 5인 이상 대규모 벙 완주 (${groupCount}명 모임) (+3점)`,
    })

    // 5. 5인 이상 벙 주최자(벙주) 리더 보너스 (+2점)
    if (ctx.isHost) {
      results.push({
        rule_type: 'HOST_5PLUS',
        points: 2,
        description: '👑 5인 이상 벙 주최 벙주 보너스 (+2점)',
      })
    }
  }

  // 6. 미라클 모닝 / 새벽런 (05:00 ~ 08:30) (+1점)
  if (ctx.runTime) {
    const hour = parseInt(ctx.runTime.split(':')[0], 10)
    const minute = parseInt(ctx.runTime.split(':')[1] || '0', 10)
    const totalMinutes = hour * 60 + minute
    if (totalMinutes >= 300 && totalMinutes <= 510) {
      results.push({
        rule_type: 'MORNING',
        points: 1,
        description: '새벽런 보너스 (05:00~08:30) (+1점)',
      })
    }
  }

  // 7. 크로스 런 (타 팀원과의 동반런) (+2점)
  if (ctx.sameLocationRunnersToday && ctx.sameLocationRunnersToday.length >= 2) {
    const otherTeams = new Set(
      ctx.sameLocationRunnersToday
        .map((r) => r.teamId)
        .filter((t): t is string => Boolean(t))
    )
    if (otherTeams.size >= 2) {
      results.push({
        rule_type: 'CROSS_RUN',
        points: 2,
        description: '타 팀원과의 크로스런 화합 보너스 (+2점)',
      })
    }
  }

  // 8. 👑 팀 완전체(100%) 동반런 (대회 최고점 +50점)
  if (ctx.myTeamMemberIds && ctx.myTeamMemberIds.length > 0 && ctx.sameLocationRunnersToday) {
    const presentUserIds = new Set(ctx.sameLocationRunnersToday.map((r) => r.userId))
    const isAllPresent = ctx.myTeamMemberIds.every((id) => presentUserIds.has(id))
    if (isAllPresent) {
      results.push({
        rule_type: 'PERFECT_RUN',
        points: 50,
        description: '👑 팀 완전체(100%) 동반런 역전 치트키 (+50점)',
      })
    }
  }

  return results
}

/**
 * 🃏 [히든 카드] 전원 3회 이상 출석 시 '최고 단일 득점 x3배' 역전 보너스 계산
 * @param teamMemberCount 팀 전체 인원수
 * @param memberRunCounts 팀원별 인증 횟수 맵 (userId -> count)
 * @param currentScoreLogs 팀이 현재까지 획득한 점수 로그 목록
 */
export function checkHiddenCardBonus(
  teamMemberCount: number,
  memberRunCounts: Record<string, number>,
  currentScoreLogs: { points: number; rule_type: string }[]
): { isEligible: boolean; bonusPoints: number; highestPoint: number } {
  // 팀원 전원이 3회 이상 뛰었는지 검사
  const activeRunnerIds = Object.keys(memberRunCounts)
  if (activeRunnerIds.length < teamMemberCount) {
    return { isEligible: false, bonusPoints: 0, highestPoint: 0 }
  }

  const allAtLeastThree = activeRunnerIds.every((uid) => (memberRunCounts[uid] || 0) >= 3)
  if (!allAtLeastThree) {
    return { isEligible: false, bonusPoints: 0, highestPoint: 0 }
  }

  // 지금까지 획득한 단일 최고 득점 추출 (이미 발동된 히든 카드 제외)
  const validLogs = currentScoreLogs.filter((l) => l.rule_type !== 'HIDDEN_CARD_X3')
  const highest = validLogs.reduce((max, cur) => Math.max(max, cur.points), 0)

  // x3배 (추가되는 점수는 최고점 x 2배)
  const bonusPoints = highest * 2

  return { isEligible: true, bonusPoints, highestPoint: highest }
}
