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
  // Determine status
  const getStatus = () => {
    if (isDuesExemptRole(role)) {
      return {
        label: '면제 대상',
        color: 'text-blue-600 bg-blue-50 border-blue-100',
        icon: '👑',
        desc: '회비 면제 직책(크루장/스태프/페이서팀장)으로 회비가 면제되었습니다.',
      }
    }
    if (duesStatus === 'PAID') {
      return {
        label: '납부완료',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        icon: '✅',
        desc: '소중한 회비 납부에 감사드립니다.',
      }
    }
    if (duesStatus === 'PENDING') {
      return {
        label: '확인대기',
        color: 'text-orange-650 bg-orange-50 border-orange-100',
        icon: '⏳',
        desc: '운영진이 수금 내역을 확인하고 있습니다.',
      }
    }
    return {
      label: '미납',
      color: 'text-red-500 bg-red-50 border-red-100',
      icon: '💰',
      desc: '말일까지 회비(10,000원) 납부를 부탁드립니다.',
    }
  }

  const status = getStatus()
  const isUnpaid =
    !isDuesExemptRole(role) &&
    duesStatus !== 'PAID' &&
    duesStatus !== 'PENDING'

  // 납부 기간이 아닐 때는 납부 완료 상태가 아니라면 굳이 미납 경고를 크게 띄우지 않고 탭으로만 노출
  if (!isDuesPeriod && isUnpaid) {
    return null
  }

  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-150 overflow-hidden shadow-sm animate-in fade-in duration-200">
      <Link
        href="/expenses"
        className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-all text-xs"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{status.icon}</span>
          <div className="space-y-0.5">
            <span className="font-bold text-gray-900">{month}월 회비 납부</span>
            <p className="text-[10px] text-gray-400 font-medium">{status.desc}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
          {status.label}
        </span>
      </Link>

      {/* 미납인 경우에만 입금 요청 폼 확장 노출 */}
      {isUnpaid && (
        <div className="px-4 pb-3 pt-0 border-t border-gray-100/50 mt-1">
          <div className="bg-white border border-gray-150 rounded-xl p-2.5 mt-2 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-450 font-medium">카카오뱅크</span>
              <span className="font-mono font-bold text-gray-900">3333-12-3456789 (수원러닝크루)</span>
            </div>
          </div>
          <button
            onClick={onRequestPayment}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 mt-3"
          >
            {isLoading ? '처리 중...' : '방금 입금했습니다 (확인 요청)'}
          </button>
        </div>
      )}
    </div>
  )
}
