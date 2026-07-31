import type { Database } from '@/lib/types/database.types'
import { getKstDate } from '@/utils/date'

type RunningRecord = Database['public']['Tables']['running_records']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

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

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'OWNER' || role === 'STAFF' || role === 'ADMIN'
}

/**
 * 역할이 회비 면제 대상인지 확인
 * 크루장(OWNER)/스태프(STAFF)/페이서팀장(PACER_LEADER) (및 레거시 운영진 ADMIN)
 */
export function isDuesExemptRole(role: string | null | undefined): boolean {
  return role === 'OWNER' || role === 'STAFF' || role === 'PACER_LEADER' || role === 'ADMIN'
}

/**
 * 한국 시간(KST) 기준 날짜의 연도와 월(0-indexed)을 가져오는 헬퍼 함수
 */
function getKstYearMonth(date: Date): { year: number; month: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
  })
  const formatted = formatter.format(date) // "M/YYYY"
  const [month, year] = formatted.split('/').map(num => parseInt(num, 10))
  return { year, month: month - 1 }
}

/**
 * 가입일이 한국 시간(KST) 기준으로 지정된 년-월에 해당하는지 확인 (신규 가입자)
 */
export function isJoinedInMonth(createdAtStr: string, targetDateOrStr: Date | string): boolean {
  if (!createdAtStr) return false
  const createdDate = new Date(createdAtStr)
  
  // 앱 런칭 전/초기 기존 회원 일괄 가입자는 "신규 첫달 면제" 대상에서 제외
  // 기준: 2026년 7월 23일 자정 이전 가입자
  const isLegacy = createdDate.getTime() < new Date('2026-07-23T00:00:00+09:00').getTime()
  if (isLegacy) return false

  let targetYear: number
  let targetMonth: number // 0-indexed

  if (typeof targetDateOrStr === 'string') {
    const parts = targetDateOrStr.split('-') // "YYYY-MM"
    targetYear = parseInt(parts[0], 10)
    targetMonth = parseInt(parts[1], 10) - 1
  } else {
    const targetKst = getKstYearMonth(targetDateOrStr)
    targetYear = targetKst.year
    targetMonth = targetKst.month
  }

  const createdKst = getKstYearMonth(createdDate)

  return (
    targetYear === createdKst.year &&
    targetMonth === createdKst.month
  )
}

/**
 * 가입일이 한국 시간(KST) 기준으로 당월(이번 달)에 해당하는지 확인 (당월 신규 가입자)
 */
export function isJoinedThisMonth(createdAtStr: string): boolean {
  return isJoinedInMonth(createdAtStr, getKstDate())
}

/**
 * 회원이 인증 면제(러닝 인증 면제) 상태인지 확인
 * 지정된 월에 가입한 사람 OR 관리자가 인증면제 설정(is_exempted)한 사람
 */
export function isRunningExempt(profile: Profile, targetDateOrStr?: Date | string): boolean {
  if (profile.is_exempted === true) return true
  
  if (targetDateOrStr) {
    return isJoinedInMonth(profile.created_at, targetDateOrStr)
  }
  return isJoinedThisMonth(profile.created_at)
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
    // 조건 A 달성률: 벙(regularDays)이 최소 1회 필요함
    // 벙이 1개 이상이면 50% (벙은 채웠으나 총 2일 미달성)
    // 벙이 0개이면 아무리 많이 뛰어도 벙이 없으므로 조건 A 기준 최대 50%만 인정 (2개 조건 중 '총 횟수'만 채운 것)
    const progressA = regularDays >= 1 
      ? 50 
      : Math.min(50, (totalDays / 2) * 50)

    // 조건 B 달성률: 개인런/6
    const progressB = (personalDays / 6) * 100
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

/**
 * Supabase/PostgREST의 기본 1,000개 조회 로우 제한을 우회하기 위해
 * .range()를 사용하여 모든 러닝 기록을 페이지네이션 조회하는 헬퍼 함수
 */
export async function fetchAllRunningRecords(
  supabase: any,
  selectFields: string,
  startDateStr?: string,
  endDateStr?: string
): Promise<any[]> {
  let allRecords: any[] = []
  let from = 0
  const limit = 1000
  let hasMore = true

  while (hasMore) {
    let query = supabase.from('running_records').select(selectFields)
    if (startDateStr) query = query.gte('run_date', startDateStr)
    if (endDateStr) query = query.lte('run_date', endDateStr)
    
    // order가 있을 경우 범위 지정 조회 시 정합성을 위해 run_date 기준 정렬 추가
    query = query.order('run_date', { ascending: false })

    const { data, error } = await query.range(from, from + limit - 1)

    if (error) throw error
    if (data && data.length > 0) {
      allRecords = [...allRecords, ...data]
      if (data.length < limit) {
        hasMore = false
      } else {
        from += limit
      }
    } else {
      hasMore = false
    }
  }

  return allRecords
}
