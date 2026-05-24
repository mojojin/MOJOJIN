import type { Database } from '@/lib/types/database.types'

type RunningRecord = Database['public']['Tables']['running_records']['Row']

export interface SurvivalStatus {
  isExempted: boolean
  isSurvived: boolean
  totalDays: number
  regularDays: number
  personalDays: number
  requiredRegular: number // 남은 필요한 벙 횟수
  requiredTotal: number   // 남은 필요한 총 횟수 (조건 A 기준)
  requiredPersonal: number // 남은 필요한 개인런 횟수 (조건 B 기준)
  statusText: string
  progressPercent: number
}

/**
 * 월간 생존 여부 및 진행 상태를 계산하는 함수
 * @param records 이번 달의 러닝 기록 목록 (run_date는 YYYY-MM-DD 형식)
 * @param isExempted 회원의 활동 면제 여부
 */
export function calculateSurvival(
  records: RunningRecord[],
  isExempted: boolean
): SurvivalStatus {
  // 면제 유저 처리
  if (isExempted) {
    return {
      isExempted: true,
      isSurvived: true,
      totalDays: 0,
      regularDays: 0,
      personalDays: 0,
      requiredRegular: 0,
      requiredTotal: 0,
      requiredPersonal: 0,
      statusText: '활동 면제 🎈',
      progressPercent: 100,
    }
  }

  // 1. [Rule 1 & Rule 2] 하루 1회 병합 및 동일 날짜 벙(REGULAR) 우선 처리
  // key: run_date (YYYY-MM-DD), value: run_type ('REGULAR' | 'PERSONAL')
  const mergedRuns = new Map<string, 'REGULAR' | 'PERSONAL'>()

  records.forEach((record) => {
    const dateStr = record.run_date
    const currentType = mergedRuns.get(dateStr)

    if (!currentType) {
      // 해당 날짜에 기록이 없으면 추가
      mergedRuns.set(dateStr, record.run_type)
    } else if (currentType === 'PERSONAL' && record.run_type === 'REGULAR') {
      // 기존에 개인런이 있었는데 벙이 추가되면 벙 우선으로 교체 (Rule 2)
      mergedRuns.set(dateStr, 'REGULAR')
    }
  })

  // 2. 벙 일수 및 개인런 일수 집계
  let regularDays = 0
  let personalDays = 0

  mergedRuns.forEach((type) => {
    if (type === 'REGULAR') {
      regularDays++
    } else {
      personalDays++
    }
  })

  const totalDays = regularDays + personalDays

  // 3. [Rule 3] 생존 조건 판별
  // 조건 A: 총 인증 일수 >= 2 AND 벙 일수 >= 1
  const conditionA = totalDays >= 2 && regularDays >= 1

  // 조건 B: 개인런 일수 >= 6 (벙 없이 개인런만으로 6회 이상)
  // 벙이 포함되어 있더라도 개인런이 6회 이상이면 생존 처리 가능한가?
  // PRD 조건 B: "(벙 참석 없이) 월 총 PERSONAL 인증 일수 >= 6" -> 개인런 단독 6일 이상
  const conditionB = personalDays >= 6

  const isSurvived = conditionA || conditionB

  // 남은 필요 횟수 계산
  // 조건 A 기준 필요량
  const requiredRegular = Math.max(0, 1 - regularDays)
  const requiredTotal = Math.max(0, 2 - totalDays)

  // 조건 B 기준 필요량 (개인런으로만 달성할 때 남은 일수)
  const requiredPersonal = Math.max(0, 6 - personalDays)

  // 진행률 계산
  // 조건 A와 조건 B 중 더 높은 달성률을 기준으로 표시
  let progressPercent = 0
  if (isSurvived) {
    progressPercent = 100
  } else {
    // 조건 A 달성률: (실제 벙 + 실제 기타)/2 (최대 100) + 벙 달성 여부 고려
    // 가중치나 단순 개수로 계산: 2일 채우는 것 기준
    const progressA = Math.min(100, (totalDays / 2) * 100)
    // 조건 B 달성률: 개인런/6
    const progressB = Math.min(100, (personalDays / 6) * 100)
    progressPercent = Math.round(Math.max(progressA, progressB))
  }

  let statusText = '생존 도전 중 🏃'
  if (isSurvived) {
    statusText = '생존 완료 🔥'
  }

  return {
    isExempted: false,
    isSurvived,
    totalDays,
    regularDays,
    personalDays,
    requiredRegular,
    requiredTotal,
    requiredPersonal,
    statusText,
    progressPercent,
  }
}
