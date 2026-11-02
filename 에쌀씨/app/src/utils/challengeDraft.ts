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
  is_bonus_pick?: boolean // 15명 정원 초과 깍두기 여부
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
  { name: '7팀 (매탄 질풍노도)', color: '#EC4899' },
  { name: '8팀 (인계 밤도깨비)', color: '#6366F1' },
  { name: '9팀 (정자 번개러너)', color: '#14B8A6' },
  { name: '10팀 (팔달 정상정복)', color: '#F59E0B' },
]

/**
 * 4포트 스네이크 드래프트 알고리즘 (팀당 기본 15명 기준 + 깍두기 균등 배분)
 * @param profiles 전체 회원 목록
 * @param records 최근 2개월(10~11월) 인증 기록
 * @param targetTeamSize 팀당 기준 인원 (기본 15명)
 */
export function generateSnakeDraftTeams(
  profiles: Profile[],
  records: RunningRecord[],
  targetTeamSize: number = 15
): DraftTeam[] {
  // 1. 제외 대상 필터링 (부상자/인증면제자 is_exempted, 대기자 WAITING, 비활성 회원)
  const activeProfiles = profiles.filter(
    (p) => !p.is_exempted && p.is_active && p.role !== 'WAITING'
  )

  const totalMembers = activeProfiles.length
  if (totalMembers === 0) return []

  // 2. 팀 개수 자동 산출 (15명씩 묶음, 최소 1팀)
  // 예: 147명 중 면제자 제외 137명이면 -> Math.floor(137 / 15) = 9팀 (15명 * 9팀 = 135명 + 깍두기 2명)
  const teamCount = Math.max(1, Math.floor(totalMembers / targetTeamSize))

  // 3. 회원별 10~11월 러닝 지수 산출
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
      port_group: 3,
    }
  })

  // 4. 실적순 내림차순 정렬
  scoredMembers.sort((a, b) => b.score - a.score)

  // 5. 4개 포트로 균등 분할
  const q1 = Math.ceil(totalMembers * 0.25)
  const q2 = Math.ceil(totalMembers * 0.5)
  const q3 = Math.ceil(totalMembers * 0.75)

  scoredMembers.forEach((m, idx) => {
    if (idx < q1) m.port_group = 1 // 에이스
    else if (idx < q2) m.port_group = 2 // 꾸준 러너
    else if (idx < q3) m.port_group = 3 // 일반 러너
    else m.port_group = 4 // 신규/비활성
  })

  // 6. 팀 초기화
  const teams: DraftTeam[] = Array.from({ length: teamCount }).map((_, i) => ({
    id: `team_${i + 1}`,
    name: TEAM_PRESETS[i]?.name || `${i + 1}팀`,
    color: TEAM_PRESETS[i]?.color || '#CCFF00',
    members: [],
  }))

  // 7. 각 포트별 스네이크(Snake) 드래프트 배정
  const ports: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4]

  ports.forEach((port) => {
    const portMembers = scoredMembers.filter((m) => m.port_group === port)
    
    portMembers.forEach((member) => {
      // 1순위: 해당 포트 인원이 가장 적은 팀
      // 2순위: 팀 전체 인원이 가장 적은 팀
      // 3순위: 팀 밸런스 총점이 가장 낮은 팀
      const sortedTeams = [...teams].sort((a, b) => {
        const portCountA = a.members.filter((m) => m.port_group === port).length
        const portCountB = b.members.filter((m) => m.port_group === port).length
        if (portCountA !== portCountB) return portCountA - portCountB

        if (a.members.length !== b.members.length) {
          return a.members.length - b.members.length
        }

        const totalScoreA = a.members.reduce((acc, cur) => acc + cur.score, 0)
        const totalScoreB = b.members.reduce((acc, cur) => acc + cur.score, 0)
        return totalScoreA - totalScoreB
      })

      // 만약 15명을 초과해서 배정되는 인원이면 깍두기 플래그 표시
      if (sortedTeams[0].members.length >= targetTeamSize) {
        member.is_bonus_pick = true
      }

      sortedTeams[0].members.push(member)
    })
  })

  return teams
}
