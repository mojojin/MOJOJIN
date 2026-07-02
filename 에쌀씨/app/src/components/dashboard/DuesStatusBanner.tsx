'use client'

import React from 'react'
import Link from 'next/link'
import { isDuesExemptRole } from '@/utils/survival'

interface DuesStatusBannerProps {
  isNewMemberThisMonth: boolean
  role: string
  duesStatus: string | null // 'PAID' | 'PENDING' | null
  isDuesPeriod: boolean
  month: number
  onRequestPayment: () => void
  isLoading: boolean
}

export default function DuesStatusBanner({
  isNewMemberThisMonth,
  role,
  duesStatus,
  isDuesPeriod,
  month,
  onRequestPayment,
  isLoading,
}: DuesStatusBannerProps) {
  const isExempt = isDuesExemptRole(role)
  const isPaid = duesStatus === 'PAID'
  const isPending = duesStatus === 'PENDING'
  const isUnpaid = !isExempt && !isPaid && !isPending

  // 납부 기간(28일~말일)이 아니면서 미납 상태인 경우, 배너를 완전히 숨겨 빚 독촉 느낌을 완전히 제거
  if (!isDuesPeriod && isUnpaid) {
    return null
  }

  // 계좌번호 복사 핸들러
  const handleCopyAccount = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText('3333192069897')
    alert('카카오뱅크 계좌번호(3333-19-2069897)가 복사되었습니다.')
  }

  // 1. 납부완료 / 면제대상 / 확인대기 상태일 때 -> 초슬림 콤팩트 한 줄 배너 노출
  if (isPaid || isExempt || isPending) {
    const bannerStyle = isPaid
      ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
      : isExempt
      ? 'bg-blue-50 border-blue-150 text-blue-700'
      : 'bg-orange-50 border-orange-150 text-orange-700'

    const badgeLabel = isPaid ? '납부완료 ✓' : isExempt ? '회비면제 👑' : '확인대기 ⏳'
    const bannerDesc = isPaid
      ? `${month}월 회비가 정상적으로 수납되었습니다.`
      : isExempt
      ? '회비 면제 직책으로 이번 달 회비가 면제되었습니다.'
      : '수금 확인을 위해 입금 내역을 대조 중입니다.'

    return (
      <div className={`rounded-2xl border ${bannerStyle} px-4 py-2.5 flex items-center justify-between text-xs shadow-sm animate-in fade-in duration-200`}>
        <div className="flex items-center gap-2 truncate">
          <span className="font-extrabold">{month}월 회비</span>
          <span className="text-[10px] opacity-75 truncate">{bannerDesc}</span>
        </div>
        <span className="text-[10px] font-black shrink-0 uppercase tracking-wider">
          {badgeLabel}
        </span>
      </div>
    )
  }

  // 2. 미납 상태이면서 납부 기간(28일~말일)인 경우 -> 계좌 정보 및 입금 완료 요청 풀 배너 노출
  return (
    <div className="rounded-2xl bg-white border border-gray-150 overflow-hidden shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="text-sm shrink-0">💰</span>
          <span className="font-bold text-gray-900 text-xs">{month}월 회비 납부 안내</span>
        </div>
        <span className="text-[9px] font-black px-2 py-0.5 rounded-md border text-red-500 bg-red-50 border-red-100 shrink-0 text-center uppercase">
          미납
        </span>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[11px] text-gray-500 leading-relaxed">
          이번 달 회비 정산을 위해 아래 계좌로 **10,000원** 송금 후 확인 버튼을 눌러주세요.
        </p>

        {/* 계좌번호 정보 카드 (터치 시 자동 복사) */}
        <button
          onClick={handleCopyAccount}
          className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl p-3 flex items-center justify-between transition-all active:scale-[0.99] text-left"
          title="터치하여 계좌번호 복사"
        >
          <div>
            <span className="text-[9px] text-gray-450 block font-medium">카카오뱅크 (터치하여 복사)</span>
            <span className="font-mono font-bold text-gray-900 text-xs mt-0.5 block">
              3333-19-2069897
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-gray-400 block font-medium">예금주</span>
            <span className="font-bold text-gray-900 text-xs mt-0.5 block">박병진</span>
          </div>
        </button>

        <button
          onClick={onRequestPayment}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {isLoading ? (
            '처리 중...'
          ) : (
            <>
              <span>방금 입금했습니다 (확인 요청)</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
