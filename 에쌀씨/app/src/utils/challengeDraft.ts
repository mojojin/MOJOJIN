import { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

export interface DraftMember {
  user_id: string
  nickname: string
  role: string
  total_distance: number
  run_count: number
  score: number // (distance * 0.6) + (count * 10 * 0.4)
  port_group: 1 | 2 | 3 | 4
  is_bonus_pick?: boolean // 15명 정원 초과 깍두기 여부
  can_be_captain: boolean // 크루장/스태프/훈련팀장 제외 여부
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
  // 1. 제외 대상 필터링
  // - 부상자/인증면제자 is_exempted 원천 제외!
  // - 크루장(role === 'OWNER'): 심판 및 총괄 관리자이므로 팀 배정 자체에서 원천 제외!
  // - 대기자 WAITING, 비활성 회원 제외
  const activeProfiles = profiles.filter(
    (p) => !p.is_exempted && p.is_active && p.role !== 'WAITING' && p.role !== 'OWNER'
  )

  const totalMembers = activeProfiles.length
  if (totalMembers === 0) return []

  // 2. 팀 개수 자동 산출 (15명씩 묶음, 최소 1팀)
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

  // 스태프 / 훈련팀장(페이서팀장/페이서/어드민)은 팀장은 못 맡지만 일반 팀원으로 참여
  const isLeadershipRole = (role: string) => {
    return ['STAFF', 'ADMIN', 'PACER_LEADER', 'PACER'].includes(role)
  }

  const scoredMembers: DraftMember[] = activeProfiles.map((p) => {
    const stat = statsMap[p.id] || { total_distance: 0, run_count: 0 }
    const score = stat.total_distance * 0.6 + stat.run_count * 10 * 0.4
    return {
      user_id: p.id,
      nickname: p.nickname,
      role: p.role,
      total_distance: Math.round(stat.total_distance * 10) / 10,
      run_count: stat.run_count,
      score: Math.round(score * 10) / 10,
      port_group: 3,
      can_be_captain: !isLeadershipRole(p.role), // 순수 일반 회원만 팀장 가능
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

      if (sortedTeams[0].members.length >= targetTeamSize) {
        member.is_bonus_pick = true
      }

      sortedTeams[0].members.push(member)
    })
  })

  // 8. 팀장 선출 정리:
  // 각 팀에서 "can_be_captain === true(일반 크루원)" 중 포트 점수가 가장 높은 멤버를 팀 상단(1순위)으로 정렬
  teams.forEach((t) => {
    const captainIdx = t.members.findIndex((m) => m.can_be_captain)
    if (captainIdx > 0) {
      const [captain] = t.members.splice(captainIdx, 1)
      t.members.unshift(captain)
    }
  })

  return teams
}
