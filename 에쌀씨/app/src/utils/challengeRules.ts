/**
 * 12월 원팀 챌린지 점수 계산 엔진
 * 단일 러닝 인증에 대해 부여할 점수와 규칙을 판별합니다.
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
  isScheduledRun?: boolean
  isHost?: boolean
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

  // 2. 개인 런 점수 (1일 1회 한정)
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

  // 3. 미라클 모닝 / 새벽런 (05:00 ~ 08:30)
  if (ctx.runTime) {
    const hour = parseInt(ctx.runTime.split(':')[0], 10)
    const minute = parseInt(ctx.runTime.split(':')[1] || '0', 10)
    const totalMinutes = hour * 60 + minute
    // 05:00 (300분) ~ 08:30 (510분)
    if (totalMinutes >= 300 && totalMinutes <= 510) {
      results.push({
        rule_type: 'MORNING',
        points: 1,
        description: '새벽런 보너스 (05:00~08:30) (+1점)',
      })
    }
  }

  // 3-1. 정기런(벙) 참가 보너스 (+2점)
  if (ctx.isScheduledRun) {
    results.push({
      rule_type: 'REGULAR_RUN',
      points: 2,
      description: '크루 공식 정기런/벙 참가 보너스 (+2점)',
    })
  }

  // 4. 3인 이상 벙 동반런 (+2점)
  const groupCount = ctx.sameLocationRunnersToday?.length || 0
  if (groupCount >= 3) {
    results.push({
      rule_type: 'GATHERING',
      points: 2,
      description: `3인 이상 동반런 (${groupCount}명 모임) (+2점)`,
    })
  }

  // 5. 벙 개설자(호스트) 보너스 (+1점)
  if (ctx.isHost && groupCount >= 3) {
    results.push({
      rule_type: 'HOST',
      points: 1,
      description: '3인 이상 벙 주최자(벙주) 보너스 (+1점)',
    })
  }

  // 6. 크로스 런 (타 팀원과의 동반런) (+2점)
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

  // 7. 완전체 동반런 (100% 출석 치트키 +40점)
  if (ctx.myTeamMemberIds && ctx.myTeamMemberIds.length > 0 && ctx.sameLocationRunnersToday) {
    const presentUserIds = new Set(ctx.sameLocationRunnersToday.map((r) => r.userId))
    const isAllPresent = ctx.myTeamMemberIds.every((id) => presentUserIds.has(id))
    if (isAllPresent) {
      results.push({
        rule_type: 'PERFECT_RUN',
        points: 40,
        description: '★ 팀 완전체(100%) 동반런 역전 치트키 (+40점)',
      })
    }
  }

  return results
}
