'use client'

import React from 'react'
import type { SurvivalStatus } from '@/utils/survival'

interface SurvivalProgressProps {
  status: SurvivalStatus
}

export default function SurvivalProgress({ status }: SurvivalProgressProps) {
  const {
    isExempted,
    isSurvived,
    totalDays,
    regularDays,
    personalDays,
    requiredRegular,
    requiredTotal,
    statusText,
    progressPercent,
  } = status

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gray-900/60 p-6 backdrop-blur-xl shadow-2xl">
      {/* 백그라운드 빛 효과 */}
      <div
        className={`absolute -right-16 -top-16 h-36 w-36 rounded-full blur-[80px] transition-all duration-1000 ${
          isExempted
            ? 'bg-blue-500/20'
            : isSurvived
            ? 'bg-emerald-500/20 animate-pulse'
            : 'bg-amber-500/20'
        }`}
      />

      <div className="flex flex-col gap-6">
        {/* 상단: 상태 및 배지 */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Monthly Active Status
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              {isExempted ? '이번 달 활동 면제' : '월간 생존 현황'}
            </h2>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold shadow-inner ${
              isExempted
                ? 'bg-blue-950/50 border border-blue-500/30 text-blue-400'
                : isSurvived
                ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400'
                : 'bg-amber-950/50 border border-amber-500/30 text-amber-400 animate-pulse'
            }`}
          >
            <span>{isExempted ? '🎈' : isSurvived ? '🔥' : '🏃'}</span>
            <span>{statusText}</span>
          </div>
        </div>

        {/* 메인: 프로그레스 바 & 통계 */}
        {!isExempted && (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-sm font-medium text-gray-400">Survival Progress</span>
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {progressPercent}%
              </span>
            </div>

            {/* 고급 프로그레스 바 */}
            <div className="h-3 w-full rounded-full bg-gray-800/80 overflow-hidden p-[1px]">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(245,158,11,0.3)] ${
                  isSurvived
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'bg-gradient-to-r from-amber-500 to-orange-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 통계 그리드 */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm">
                <span className="block text-xs font-medium text-gray-500">인증 일수</span>
                <span className="mt-1 block text-lg font-bold text-white">{totalDays}일</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm">
                <span className="block text-xs font-medium text-gray-500">벙(정기)</span>
                <span className="mt-1 block text-lg font-bold text-emerald-400">{regularDays}회</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm">
                <span className="block text-xs font-medium text-gray-500">개인런</span>
                <span className="mt-1 block text-lg font-bold text-amber-400">{personalDays}회</span>
              </div>
            </div>
          </div>
        )}

        {/* 면제 상태일 때 UI */}
        {isExempted && (
          <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4 text-center text-sm leading-relaxed text-blue-300">
            부상 또는 기타 부득이한 사유로 인해 운영자로부터 이번 달 활동 의무가 면제되었습니다. 빠른 쾌유와 복귀를 응원합니다! 🩹
          </div>
        )}

        {/* 생존 규칙 달성 가이드 */}
        {!isExempted && !isSurvived && (
          <div className="mt-2 rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              생존 조건 달성 가이드 (택 1)
            </h4>
            
            <div className="space-y-2 text-xs">
              {/* 조건 A */}
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  regularDays >= 1 && totalDays >= 2 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {regularDays >= 1 && totalDays >= 2 ? '✓' : 'A'}
                </div>
                <div className="text-gray-400 leading-normal">
                  <span className="font-medium text-gray-200">벙 1회 포함 총 2일 달리기</span>
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    현재 상태: 벙 {regularDays}/1회, 총 {totalDays}/2일
                    {requiredTotal > 0 || requiredRegular > 0 ? (
                      <span className="text-amber-500 ml-1">
                        (벙 {requiredRegular}회, 총 {requiredTotal}일 추가 필요)
                      </span>
                    ) : (
                      <span className="text-emerald-400 ml-1">(만족!)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 조건 B */}
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  personalDays >= 6 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {personalDays >= 6 ? '✓' : 'B'}
                </div>
                <div className="text-gray-400 leading-normal">
                  <span className="font-medium text-gray-200">개인런으로만 총 6일 달리기</span>
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    현재 상태: 개인런 {personalDays}/6일
                    {personalDays < 6 ? (
                      <span className="text-amber-500 ml-1">
                        ({6 - personalDays}일 추가 필요)
                      </span>
                    ) : (
                      <span className="text-emerald-400 ml-1">(만족!)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 생존 완료 시 축하 메시지 */}
        {!isExempted && isSurvived && (
          <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-center">
            <span className="text-lg font-bold text-emerald-400">🎉 이번 달 생존 성공!</span>
            <p className="mt-1 text-xs text-gray-400 leading-normal">
              훌륭합니다! 의무 러닝 조건을 충족하여 생존을 완료하셨습니다. 계속해서 건강하고 즐거운 러닝 라이프를 즐겨주세요!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
