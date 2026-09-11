import type { Database } from '@/lib/types/database.types'
import { calculateSurvival, isJoinedThisMonth } from '@/utils/survival'

type RunningRecord = Database['public']['Tables']['running_records']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  unlocked: boolean
  category: 'DISTANCE' | 'ATTENDANCE' | 'SPEED' | 'SPECIAL'
  progressText?: string
}

/**
 * 사용자 데이터 기반으로 획득 배지 목록을 계산합니다.
 */
export function calculateUserBadges(
  records: RunningRecord[],
  profile: Profile | null,
  targetMonthStr: string
): Badge[] {
  // 당월 기록 필터링
  const monthRecords = records.filter(r => r.run_date && r.run_date.startsWith(targetMonthStr))
  const totalDistance = monthRecords.reduce((sum, r) => sum + (Number(r.distance) || 0), 0)
  const regularCount = monthRecords.filter(r => r.record_type === 'REGULAR').length
  const totalRunCount = monthRecords.length

  // 생존 여부 계산
  const survival = profile ? calculateSurvival(monthRecords, profile, targetMonthStr) : null

  // 최단 페이스 계산 (초/km)
  let bestPaceSeconds = Infinity
  records.forEach(r => {
    if (r.pace) {
      const parts = r.pace.split("'")
      if (parts.length >= 2) {
        const min = parseInt(parts[0], 10)
        const sec = parseInt(parts[1].replace('"', ''), 10) || 0
        if (!isNaN(min)) {
          const totalSec = min * 60 + sec
          if (totalSec < bestPaceSeconds) bestPaceSeconds = totalSec
        }
      }
    }
  })

  // 신규 가입자 여부
  const isNew = profile ? isJoinedThisMonth(profile.created_at) : false

  const badges: Badge[] = [
    {
      id: 'SURVIVAL_KING',
      name: '생존 완료',
      icon: '🛡️',
      description: '이번 달 생존 미션을 무사히 달성했습니다!',
      unlocked: survival ? survival.isSurvived || survival.isExempted : false,
      category: 'SPECIAL',
      progressText: survival?.isSurvived ? '달성 완료' : '미달성'
    },
    {
      id: '100KM_CLUB',
      name: '100km 클럽',
      icon: '🏃‍♂️',
      description: '한 달 누적 러닝 거리 100km 이상 달성',
      unlocked: totalDistance >= 100,
      category: 'DISTANCE',
      progressText: `${totalDistance.toFixed(1)} / 100km`
    },
    {
      id: '50KM_CLUB',
      name: '50km 클럽',
      icon: '👟',
      description: '한 달 누적 러닝 거리 50km 이상 달성',
      unlocked: totalDistance >= 50,
      category: 'DISTANCE',
      progressText: `${totalDistance.toFixed(1)} / 50km`
    },
    {
      id: 'REGULAR_MASTER',
      name: '정기런 마스터',
      icon: '🔥',
      description: '이번 달 정기런 4회 이상 참여',
      unlocked: regularCount >= 4,
      category: 'ATTENDANCE',
      progressText: `${regularCount} / 4회`
    },
    {
      id: 'SPEED_DEMON',
      name: '스피드 레이서',
      icon: '⚡',
      description: '5분대 이하 페이스(5\'00"/km 이하) 인증 기록 보유',
      unlocked: bestPaceSeconds <= 300,
      category: 'SPEED',
      progressText: bestPaceSeconds !== Infinity ? `${Math.floor(bestPaceSeconds / 60)}'${String(bestPaceSeconds % 60).padStart(2, '0')}"` : '기록 없음'
    },
    {
      id: 'NEWCOMER',
      name: 'SRC 새싹',
      icon: '🌱',
      description: 'SRC 러닝크루 신규 회원',
      unlocked: isNew,
      category: 'SPECIAL',
      progressText: isNew ? '신규 회원' : '기존 회원'
    }
  ]

  return badges
}
