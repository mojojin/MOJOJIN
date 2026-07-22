const fs = require('fs');

const code = `'use client'

import React, { useState } from 'react'

interface MarathonHallOfFameProps {
  userId: string
  isAdmin: boolean
  hallOfFame: any[]
  onDeleteRecord?: (id: string) => void
  onEditRecord?: (record: any) => void
}

/** PostgreSQL interval 문자열 '01:45:00' → 'HH:MM:SS' 표시용 파싱 */
function formatRecordTime(raw: string): string {
  if (!raw) return ''
  const parts = raw.split(':')
  if (parts.length < 3) return raw
  const hh = parts[0].padStart(2, '0')
  const mm = parts[1].padStart(2, '0')
  const ss = parts[2].split('.')[0].padStart(2, '0')
  return \`\${hh}:\${mm}:\${ss}\`
}

function getBadgeInfo(count: number) {
  if (count >= 30) return { icon: '👑', label: '레전드', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' }
  if (count >= 20) return { icon: '🥇', label: '골드 마라토너', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' }
  if (count >= 10) return { icon: '🥈', label: '실버 마라토너', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-300' }
  if (count >= 5) return { icon: '🥉', label: '브론즈 마라토너', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' }
  if (count >= 1) return { icon: '🏅', label: '마라토너', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
  return { icon: '🏃', label: '도전자', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' }
}

export default function MarathonHallOfFame({
  userId,
  isAdmin,
  hallOfFame,
  onDeleteRecord,
  onEditRecord,
}: MarathonHallOfFameProps) {
  const [filter, setFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  const filteredList = hallOfFame.filter(record => {
    const nickname = record.profiles?.nickname || '';
    
    // 성별 필터
    let passGender = true;
    if (filter === 'MALE') passGender = nickname.endsWith('남') || nickname.includes('/남');
    if (filter === 'FEMALE') passGender = nickname.endsWith('여') || nickname.includes('/여');
    
    // 검색 필터
    let passSearch = true;
    if (searchQuery.trim() !== '') {
      const namePart = nickname.split('/')[0]; // 이름 부분만 추출
      passSearch = namePart.includes(searchQuery.trim());
    }

    return passGender && passSearch;
  });

  return (
    <div className="space-y-4">
      {/* 상단 컨트롤러 (탭 + 검색) */}
      <div className="flex flex-col gap-3">
        {/* 랭킹 탭 */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('ALL')}
            className={\`flex-1 rounded-lg py-2 text-xs font-bold transition-all \${
              filter === 'ALL'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }\`}
          >
            전체 랭킹
          </button>
          <button
            onClick={() => setFilter('MALE')}
            className={\`flex-1 rounded-lg py-2 text-xs font-bold transition-all \${
              filter === 'MALE'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }\`}
          >
            남자부
          </button>
          <button
            onClick={() => setFilter('FEMALE')}
            className={\`flex-1 rounded-lg py-2 text-xs font-bold transition-all \${
              filter === 'FEMALE'
                ? 'bg-red-400 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }\`}
          >
            여자부
          </button>
        </div>

        {/* 검색창 */}
        <div className="relative">
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="이름으로 러너 검색..."
            className="w-full rounded-xl bg-white border border-gray-200 pl-10 pr-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 transition-all shadow-sm"
          />
          <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* 리스트 출력 (시인성 향상된 컴팩트 테이블형 레이아웃) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-gray-50/50">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredList.map((record, index) => {
              const badge = getBadgeInfo(record.completion_count || 0)
              const isMe = record.user_id === userId
              const rank = index + 1;

              return (
                <div 
                  key={record.id} 
                  className={\`
                    relative flex items-center justify-between p-3.5 sm:p-4 transition-all cursor-pointer group
                    \${isMe ? 'bg-[#CCFF00]/10' : 'hover:bg-gray-50'}
                  \`}
                  onClick={() => setSelectedUser(record)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* 순위 (1~3위는 트로피/메달 이모지 강조) */}
                    <div className="w-8 shrink-0 flex justify-center">
                      {rank === 1 ? <span className="text-2xl drop-shadow-sm">🥇</span> :
                       rank === 2 ? <span className="text-2xl drop-shadow-sm">🥈</span> :
                       rank === 3 ? <span className="text-2xl drop-shadow-sm">🥉</span> :
                       <span className="text-sm font-bold text-gray-400 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full">{rank}</span>}
                    </div>

                    {/* 메인 정보 (이름, 뱃지, 횟수) */}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm truncate">
                          {record.profiles?.nickname?.split('/')[0] || '알 수 없음'}
                        </span>
                        <span className={\`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold border \${badge.bg} \${badge.color}\`}>
                          {badge.icon} {badge.label}
                        </span>
                        {isMe && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-900 text-[#CCFF00]">
                            ME
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 font-medium truncate">
                        풀코스 완주 <span className="font-bold text-gray-700">{record.completion_count}</span>회
                        {record.profiles?.nickname && \` • \${record.profiles.nickname.split('/').slice(1).join('/')}\`}
                      </div>
                    </div>
                  </div>

                  {/* 우측 정보 (기록 및 관리자 버튼) */}
                  <div className="flex flex-col items-end shrink-0 ml-3">
                    {record.record_time && (
                      <div className="font-mono text-sm font-bold text-gray-800">
                        {formatRecordTime(record.record_time)}
                      </div>
                    )}
                    {record.event_name && (
                      <div className="text-[10px] text-gray-400 max-w-[100px] truncate">
                        {record.event_name}
                      </div>
                    )}
                    
                    {/* 어드민 수정/삭제 (평소엔 숨기고 hover 시 또는 항상 작게 표시) */}
                    {isAdmin && (
                      <div className="flex gap-1 mt-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRecord?.(record);
                          }}
                          className="text-[9px] text-gray-400 hover:text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200"
                        >
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if(confirm(\`\${record.profiles?.nickname} 님의 기록을 삭제하시겠습니까?\`)) {
                              onDeleteRecord?.(record.id);
                            }
                          }}
                          className="text-[9px] text-red-400 hover:text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 타임라인 모달 */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center space-y-2 mb-6 mt-4">
              <div className="inline-block text-4xl mb-2">
                {getBadgeInfo(selectedUser.completion_count || 0).icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedUser.profiles?.nickname?.split('/')[0]} <span className="text-sm font-normal text-gray-500">러너</span>
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                총 <span className="font-bold text-gray-900">{selectedUser.completion_count}회</span> 풀코스 완주 달성
              </p>
            </div>

            <div className="border-l-2 border-gray-100 ml-4 pl-4 space-y-6 relative py-2">
              <div className="absolute top-0 left-[-5px] w-2 h-2 bg-gray-300 rounded-full" />
              
              <div className="relative">
                <div className="absolute top-1.5 -left-[23px] w-4 h-4 bg-white border-2 border-[#CCFF00] rounded-full shadow-sm" />
                <p className="text-xs font-bold text-gray-500 mb-0.5">개인 최고 기록 (PB)</p>
                <p className="text-sm font-bold text-gray-900">{formatRecordTime(selectedUser.record_time) || '기록 없음'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selectedUser.event_name || '대회 정보 없음'}</p>
              </div>

              {selectedUser.motto && (
                <div className="relative">
                  <div className="absolute top-1.5 -left-[23px] w-4 h-4 bg-white border-2 border-blue-400 rounded-full shadow-sm" />
                  <p className="text-xs font-bold text-gray-500 mb-0.5">러닝 좌우명</p>
                  <p className="text-sm font-medium text-gray-800 italic">"{selectedUser.motto}"</p>
                </div>
              )}
              
              <div className="absolute bottom-0 left-[-5px] w-2 h-2 bg-gray-300 rounded-full" />
            </div>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-full bg-gray-900 text-white font-bold text-sm py-3 rounded-2xl active:scale-95 transition-transform"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'

fs.writeFileSync('src/components/marathon/MarathonHallOfFame.tsx', code);
console.log('MarathonHallOfFame.tsx updated successfully!');
