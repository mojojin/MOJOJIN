'use client'

import React, { useState } from 'react'

interface RankingBoardProps {
  weeklyRanking: { userId: string; nickname: string; distance: number; rank: number }[]
  monthlyRanking: { userId: string; nickname: string; distance: number; rank: number }[]
  encouragedRunner: { nickname: string; distance: number; title: string } | null
  userId: string
}

export default function RankingBoard({
  weeklyRanking,
  monthlyRanking,
  encouragedRunner,
  userId,
}: RankingBoardProps) {
  const [rankTab, setRankTab] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY')

  const currentList = rankTab === 'WEEKLY' ? weeklyRanking : monthlyRanking
  const top5 = currentList.slice(0, 5)
  const myItem = currentList.find((item) => item.userId === userId)
  const isMyItemInTop5 = myItem && myItem.rank <= 5

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
          🏆 마일리지 랭킹보드
        </h3>
        <span className="text-[10px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
          실시간 반영
        </span>
      </div>

      {/* 주간 / 월간 탭 스위처 */}
      <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
        <button
          onClick={() => setRankTab('WEEKLY')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
            rankTab === 'WEEKLY'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          주간 ⚡️
        </button>
        <button
          onClick={() => setRankTab('MONTHLY')}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
            rankTab === 'MONTHLY'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          월간 🔥
        </button>
      </div>

      {/* 랭킹 명단 */}
      <div className="space-y-2">
        {currentList.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-6">랭킹 정보를 불러오는 중입니다...</div>
        ) : (
          <>
            {top5.map((runner) => {
              const isMe = runner.userId === userId
              const medal =
                runner.rank === 1 ? '🥇' : runner.rank === 2 ? '🥈' : runner.rank === 3 ? '🥉' : null
              return (
                <div
                  key={runner.userId}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-neon-yellow/10 border-neon-yellow/40 font-bold'
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs font-bold text-gray-400 flex justify-center items-center">
                      {medal ? <span className="text-sm leading-none">{medal}</span> : `${runner.rank}`}
                    </span>
                    <span className={`text-xs ${isMe ? 'text-gray-900 font-bold' : 'text-gray-700 font-medium'}`}>
                      {runner.nickname}
                      {isMe && (
                        <span className="text-[9px] bg-gray-900 text-neon-yellow px-1 ml-1 rounded font-bold">
                          MY
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-900">
                    {runner.distance.toFixed(1)}{' '}
                    <span className="text-[10px] text-gray-400 font-normal">km</span>
                  </span>
                </div>
              )
            })}

            {/* 내가 Top 5에 없을 때 아래에 추가 표시 */}
            {myItem && !isMyItemInTop5 && (
              <>
                <div className="flex justify-center py-1">
                  <div className="h-3 border-l border-dashed border-gray-300" />
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl border bg-neon-yellow/10 border-neon-yellow/40 font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs font-bold text-gray-500">{myItem.rank}</span>
                    <span className="text-xs text-gray-900 font-bold">
                      {myItem.nickname}
                      <span className="text-[9px] bg-gray-900 text-neon-yellow px-1 ml-1 rounded font-bold">
                        MY
                      </span>
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-900">
                    {myItem.distance.toFixed(1)}{' '}
                    <span className="text-[10px] text-gray-400 font-normal">km</span>
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* 격려 부스팅 카드 */}
      {encouragedRunner && (
        <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
              🚀 응원 부스터
            </span>
            <span className="text-[10px] text-gray-400 font-medium">다음 달 힘내기 예약 명단!</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-700 leading-relaxed">
              이번 달 마일리지를 숨고르기 중인{' '}
              <span className="font-bold text-gray-900 underline decoration-neon-yellow decoration-2">
                {encouragedRunner.nickname}
              </span>
              님!
            </p>
            <div className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-2.5 py-2">
              <span className="text-[10px] text-gray-500 font-semibold">{encouragedRunner.title}</span>
              <span className="text-xs font-mono font-bold text-gray-400">
                {encouragedRunner.distance.toFixed(1)} km
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
