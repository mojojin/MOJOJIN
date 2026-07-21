'use client'

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
  return `${hh}:${mm}:${ss}`
}

function getBadgeInfo(count: number) {
  if (count >= 30) return { icon: '👑', label: '레전드', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' }
  if (count >= 20) return { icon: '⭐⭐', label: '2성 마라토너', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' }
  if (count >= 10) return { icon: '⭐', label: '1성 마라토너', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
  if (count === 1) return { icon: '🌱', label: '새싹 러너', color: 'text-green-600', bg: 'bg-green-50 border-green-200' }
  return { icon: '🏅', label: '마라토너', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200' }
}

export default function MarathonHallOfFame({
  userId,
  isAdmin,
  hallOfFame,
  onDeleteRecord,
  onEditRecord,
}: MarathonHallOfFameProps) {
  const [filter, setFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  // 간단한 필터 처리 (실제 성별 데이터가 없으므로 프론트엔드 모의 데이터나 현재 있는 데이터로 필터링)
  // 현재 profiles 테이블에 gender 정보가 없으므로 필터 버튼만 만들어두고 전체 목록 노출
  const filteredList = hallOfFame

  return (
    <div className="space-y-4">
      {/* 랭킹 탭 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('ALL')}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 ${
            filter === 'ALL'
              ? 'bg-gray-900 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          전체 랭킹
        </button>
        {/* 추후 성별 정보 추가 시 활성화 */}
        <button
          className="flex-1 rounded-xl py-2 text-xs font-bold bg-gray-50 border border-gray-200 text-gray-300 cursor-not-allowed"
          title="성별 정보 업데이트 예정"
        >
          남자부
        </button>
        <button
          className="flex-1 rounded-xl py-2 text-xs font-bold bg-gray-50 border border-gray-200 text-gray-300 cursor-not-allowed"
          title="성별 정보 업데이트 예정"
        >
          여자부
        </button>
      </div>

      {/* 리스트 출력 */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200 text-sm">
            아직 풀코스 완주 기록이 없습니다.
          </div>
        ) : (
          filteredList.map((record, index) => {
            const badge = getBadgeInfo(record.completion_count || 0)
            const isMe = record.user_id === userId

            return (
              <div 
                key={record.id} 
                className={`
                  relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all
                  ${isMe ? 'bg-[#CCFF00]/10 border-[#CCFF00]' : 'bg-white border-gray-200 hover:border-gray-300'}
                  cursor-pointer
                `}
                onClick={() => setSelectedUser(record)}
              >
                {/* 배경 장식 */}
                {index < 3 && (
                  <div className="absolute -right-4 -top-4 text-6xl opacity-5 pointer-events-none">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                )}
                
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    {/* 등수 뱃지 */}
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs shrink-0
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        index === 1 ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                        index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        'bg-gray-50 text-gray-500 border border-gray-100'}
                    `}>
                      {index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">
                          {record.profiles?.nickname || '알 수 없음'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.color}`}>
                          {badge.icon} {badge.label}
                        </span>
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-900 text-[#CCFF00]">
                            ME
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 font-medium">
                        풀코스 완주 <span className="font-bold text-gray-900 text-sm">{record.completion_count}</span>회
                      </div>

                      {(record.record_time || record.event_name) && (
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          {record.record_time && (
                            <span className="bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                              PB {formatRecordTime(record.record_time)}
                            </span>
                          )}
                          {record.event_name && (
                            <span>{record.event_name}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 어드민 수정/삭제 버튼 */}
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRecord?.(record);
                        }}
                        className="text-[10px] text-gray-400 hover:text-gray-900 bg-gray-50 p-1.5 rounded-lg border border-gray-200 font-bold active:scale-95 transition-all"
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm(`${record.profiles?.nickname} 님의 명예의 전당 기록을 삭제하시겠습니까?`)) {
                            onDeleteRecord?.(record.id);
                          }
                        }}
                        className="text-[10px] text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-100 font-bold active:scale-95 transition-all"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>

                {/* 좌우명 (motto) */}
                {record.motto && (
                  <div className="mt-3 relative">
                    <div className="absolute -left-1 -top-2 text-xl text-gray-200 opacity-50">&quot;</div>
                    <p className="text-xs text-gray-600 font-medium italic pl-3 pr-2">
                      {record.motto}
                    </p>
                  </div>
                )}
              </div>
            )
          })
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
                {selectedUser.profiles?.nickname} <span className="text-sm font-normal text-gray-500">러너</span>
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
                <p className="text-sm font-bold text-gray-900">{formatRecordTime(selectedUser.record_time)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selectedUser.event_name || '대회 정보 없음'}</p>
              </div>

              {selectedUser.motto && (
                <div className="relative">
                  <div className="absolute top-1.5 -left-[23px] w-4 h-4 bg-white border-2 border-blue-400 rounded-full shadow-sm" />
                  <p className="text-xs font-bold text-gray-500 mb-0.5">러닝 좌우명</p>
                  <p className="text-sm font-medium text-gray-800 italic">&quot;{selectedUser.motto}&quot;</p>
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
