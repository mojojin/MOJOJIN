import { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

export interface DraftMember {
  user_id: string
  nickname: string
  total_distance: number
  run_count: number
  score: number // (distance * 0.6) + (count * 10 * 0.4)
  port_group: 1 | 2 | 3 | 4
}

export interface DraftTeam {
  id: string
  name: string
  color: string
  members: DraftMember[]
}

const TEAM_PRESETS = [
  { name: '1팀 (광교 불꽃러너)', color: '#FF4D4D' },
  { name: '2팀 (영통 칼바람)', color: '#00C8FF' },
  { name: '3팀 (행궁 달빛러너)', color: '#CCFF00' },
  { name: '4팀 (만석 폭풍질주)', color: '#FFA500' },
  { name: '5팀 (원천 호수번개)', color: '#A855F7' },
  { name: '6팀 (서호 푸른달림)', color: '#10B981' },
]

/**
 * 4포트 스네이크 드래프트 알고리즘
 * @param profiles 전체 회원 목록
 * @param records 최근 2개월(10~11월) 인증 기록
 * @param teamCount 생성할 팀 개수 (기본 4팀)
 */
export function generateSnakeDraftTeams(
  profiles: Profile[],
  records: RunningRecord[],
  teamCount: number = 4
): DraftTeam[] {
  // 1. 제외 대상 필터링 (면제자 is_exempted, 비활성 is_active=false, 대기자 WAITING)
  const activeProfiles = profiles.filter(
    (p) => !p.is_exempted && p.is_active && p.role !== 'WAITING'
  )

  // 2. 회원별 10~11월 러닝 지수 산출
  const statsMap: Record<string, { total_distance: number; run_count: number }> = {}
  records.forEach((r) => {
    if (!statsMap[r.user_id]) {
      statsMap[r.user_id] = { total_distance: 0, run_count: 0 }
    }
    statsMap[r.user_id].total_distance += Number(r.distance || 0)
    statsMap[r.user_id].run_count += 1
  })

  const scoredMembers: DraftMember[] = activeProfiles.map((p) => {
    const stat = statsMap[p.id] || { total_distance: 0, run_count: 0 }
    // 러닝 지수 = 거리 60% + 인증 빈도 40%
    const score = stat.total_distance * 0.6 + stat.run_count * 10 * 0.4
    return {
      user_id: p.id,
      nickname: p.nickname,
      total_distance: Math.round(stat.total_distance * 10) / 10,
      run_count: stat.run_count,
      score: Math.round(score * 10) / 10,
      port_group: 3, // 임시
    }
  })

  // 3. 실적순 내림차순 정렬
  scoredMembers.sort((a, b) => b.score - a.score)

  // 4. 4개 포트로 균등 분할
  const total = scoredMembers.length
  const q1 = Math.ceil(total * 0.25)
  const q2 = Math.ceil(total * 0.5)
  const q3 = Math.ceil(total * 0.75)

  scoredMembers.forEach((m, idx) => {
    if (idx < q1) m.port_group = 1 // 에이스
    else if (idx < q2) m.port_group = 2 // 꾸준 러너
    else if (idx < q3) m.port_group = 3 // 일반 러너
    else m.port_group = 4 // 신규/비활성
  })

  // 5. 팀 초기화
  const teams: DraftTeam[] = Array.from({ length: teamCount }).map((_, i) => ({
    id: `team_${i + 1}`,
    name: TEAM_PRESETS[i]?.name || `${i + 1}팀`,
    color: TEAM_PRESETS[i]?.color || '#CCFF00',
    members: [],
  }))

  // 6. 각 포트별 스네이크(Snake) 드래프트 배정
  const ports: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4]
  let reverseDirection = false

  ports.forEach((port) => {
    const portMembers = scoredMembers.filter((m) => m.port_group === port)
    
    // 약간의 랜덤성을 위해 동점대 셔플 후 순차 배정
    portMembers.forEach((member) => {
      // 현재 팀들 중 해당 포트 인원이 가장 적은 팀 우선, 동률이면 총점 낮은 팀 우선
      const sortedTeams = [...teams].sort((a, b) => {
        const countA = a.members.filter((m) => m.port_group === port).length
        const countB = b.members.filter((m) => m.port_group === port).length
        if (countA !== countB) return countA - countB
        const totalScoreA = a.members.reduce((acc, cur) => acc + cur.score, 0)
        const totalScoreB = b.members.reduce((acc, cur) => acc + cur.score, 0)
        return totalScoreA - totalScoreB
      })

      sortedTeams[0].members.push(member)
    })
    reverseDirection = !reverseDirection
  })

  return teams
}
