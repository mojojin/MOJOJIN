/**
 * 12월 원팀 챌린지 점수 계산 엔진 (최종 확정 룰)
 * 1. 완주 및 벙 기준: 무조건 3.0km 이상이어야 모든 인증 및 점수 인정!
 * 2. 👑 팀 완전체(100%) 동반런: 대회 최고점 (+60점)
 * 3. 🥇 정기런 6회 이상 참여(개근) 필터링: 멤버당 +20점 (팀 점수 대형 기여)
 * 4. 🔥 하드캐리 점수: 한 달 내내(31일) 매일매일 3km 이상 달린 멤버 배출 시, 팀 완전체런의 1/3인 +20점 추가 지급!
 * 5. 정기런 개별 참가: +5점
 * 6. 5인 이상 벙(3km 이상): +3점 & 벙주: +2점
 * 7. LSD 장거리: 10km(+3점), 15km(+5점), 20km(+8점), 25km(+12점)
 * 8. 개인 기본 캡: 3~4.9km(+1점), 5km이상(+2점)
 * 9. 새벽런: +1점, 타팀 크로스런: +2점
 * 10. 히든 카드: 전원 3회 이상 인증 시 최고 단일 득점 x3배
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
  sameLocationRunnersToday?: { userId: string; teamId?: string; distance?: number }[]
  alreadyScoredToday?: boolean
  myTeamMemberIds?: string[]
}

export function evaluateRunningPoints(ctx: RunValidationContext): PointRuleResult[] {
  const results: PointRuleResult[] = []

  // 1. [원칙] 모든 러닝 완주 및 벙 인정 기준은 3.0km 이상!
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

  // 3. 🥇 정기런(공식 런) 참석 보너스 (+5점)
  if (ctx.isScheduledRun) {
    results.push({
      rule_type: 'REGULAR_RUN',
      points: 5,
      description: '🥇 SRC 공식 정기런 참여 최고 보너스 (+5점)',
    })
  }

  // 4. 🔥 5인 이상 대규모 벙 동반런 (+3점) - 기준 3.0km 이상
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

  // 6. 🏃‍♂️ 장거리 훈련(LSD) 단체/개인 점수 차등 부여 (수정: 10km +1점 / 20km +2점 / 25km +3점)
  if (ctx.distance >= 25.0) {
    results.push({
      rule_type: 'LSD_25K',
      points: 3,
      description: '⚡ 25km 초장거리 LSD 완주 보너스 (+3점)',
    })
  } else if (ctx.distance >= 20.0) {
    results.push({
      rule_type: 'LSD_20K',
      points: 2,
      description: '⚡ 20km 장거리 하프 완주 보너스 (+2점)',
    })
  } else if (ctx.distance >= 10.0) {
    results.push({
      rule_type: 'LSD_10K',
      points: 1,
      description: '⚡ 10km 장거리 완주 보너스 (+1점)',
    })
  }

  // 7. 미라클 모닝 / 새벽런 (05:00 ~ 08:30) (+1점)
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

  // 8. 크로스 런 (타 팀원과의 동반런) (+2점)
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

  // 9. 👑 팀 완전체(100%) 동반런 (대회 최고점 +60점!)
  if (ctx.myTeamMemberIds && ctx.myTeamMemberIds.length > 0 && ctx.sameLocationRunnersToday) {
    const presentUserIds = new Set(ctx.sameLocationRunnersToday.map((r) => r.userId))
    const isAllPresent = ctx.myTeamMemberIds.every((id) => presentUserIds.has(id))
    if (isAllPresent) {
      results.push({
        rule_type: 'PERFECT_RUN',
        points: 60,
        description: '👑 팀 완전체(100%) 동반런 대회 최고점 치트키 (+60점)',
      })
    }
  }

  return results
}

/**
 * 🥇 [정기런 6회 이상 참여 기준 필터링 보너스]
 * 12월 중 공식 정기런을 6회 이상 참여한 멤버가 있을 경우,
 * 그 멤버가 속한 팀에 대형 개근 보너스 (+20점/인당)를 부여합니다.
 */
export function calculateRegularRunAttendanceBonus(
  memberScheduledRunCounts: Record<string, number> // 팀원별 정기런 참석 횟수
): { qualifiedCount: number; bonusPoints: number } {
  let count = 0
  Object.values(memberScheduledRunCounts).forEach((attended) => {
    // 6회 이상 참여 시 필터링 통과
    if (attended >= 6) {
      count++
    }
  })

  return {
    qualifiedCount: count,
    bonusPoints: count * 20, // 6회 이상 개근 멤버 1명당 팀에 +20점 부여
  }
}

/**
 * 🔥 [하드캐리 보너스]
 * 한 달(31일) 동안 '하루도 빠짐없이 매일매일 3km 이상' 달린 철인 멤버 배출 시,
 * 팀 완전체런(60점)의 1/3인 대형 보너스 (+20점/인당)를 팀에 추가 부여합니다.
 * @param memberDailyActiveDays 팀원별 3km 이상 달린 일수 (최대 31일)
 */
export function calculateHardCarryBonus(
  memberDailyActiveDays: Record<string, number>
): { hardCarryCount: number; bonusPoints: number } {
  let count = 0
  Object.values(memberDailyActiveDays).forEach((days) => {
    // 12월 31일 한 달 내내 매일 인증 (31일)
    if (days >= 31) {
      count++
    }
  })

  return {
    hardCarryCount: count,
    bonusPoints: count * 20, // 팀 완전체(60점)의 1/3 = +20점 부여
  }
}

/**
 * 🃏 [히든 카드] 전원 3회 이상 출석 시 '최고 단일 득점 x3배' 역전 보너스 계산
 */
export function checkHiddenCardBonus(
  teamMemberCount: number,
  memberRunCounts: Record<string, number>,
  currentScoreLogs: { points: number; rule_type: string }[]
): { isEligible: boolean; bonusPoints: number; highestPoint: number } {
  const activeRunnerIds = Object.keys(memberRunCounts)
  if (activeRunnerIds.length < teamMemberCount) {
    return { isEligible: false, bonusPoints: 0, highestPoint: 0 }
  }

  const allAtLeastThree = activeRunnerIds.every((uid) => (memberRunCounts[uid] || 0) >= 3)
  if (!allAtLeastThree) {
    return { isEligible: false, bonusPoints: 0, highestPoint: 0 }
  }

  const validLogs = currentScoreLogs.filter((l) => l.rule_type !== 'HIDDEN_CARD_X3')
  const highest = validLogs.reduce((max, cur) => Math.max(max, cur.points), 0)
  const bonusPoints = highest * 2

  return { isEligible: true, bonusPoints, highestPoint: highest }
}
