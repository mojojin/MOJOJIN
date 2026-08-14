'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface DrawResult {
  id: string
  target_month: string
  winner_user_id: string
  winner_nickname: string
  tickets_count: number
  created_at: string
}

interface LoungeClientProps {
  userId: string
  userNickname: string
  isAdmin: boolean
  initialDrawResults: DrawResult[]
  currentMonth: string
}

export default function LoungeClient({
  userId,
  userNickname,
  isAdmin,
  initialDrawResults,
  currentMonth,
}: LoungeClientProps) {
  const supabase = createClient() as any

  // 기본 선택 월은 현재 월의 이전 달로 지정 (예: 8월 진입 시 7월 추첨이 기본 노출되도록)
  const defaultMonth = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number)
    const prevDate = new Date(year, month - 2, 1)
    const y = prevDate.getFullYear()
    const m = String(prevDate.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }, [currentMonth])

  // 추첨 관련 상태
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)
  const [drawResults, setDrawResults] = useState<DrawResult[]>(initialDrawResults)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawAnimation, setDrawAnimation] = useState(false)

  // 가용 월 목록 생성 (현재 월 기준 최근 4개월)
  const availableMonths = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number)
    const list = []
    for (let i = 0; i < 4; i++) {
      const d = new Date(year, month - 1 - i, 1)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      list.push(`${y}-${m}`)
    }
    return list
  }, [currentMonth])

  // 선택된 월 변경 시 데이터 실시간 리로드
  useEffect(() => {
    const fetchDrawResults = async () => {
      const { data } = await supabase
        .from('lucky_draw_results')
        .select('*')
        .eq('target_month', selectedMonth)
        .order('created_at', { ascending: true })
      setDrawResults(data || [])
    }
    fetchDrawResults()
  }, [selectedMonth, supabase])

  const monthLabel = `${selectedMonth.split('-')[0]}년 ${parseInt(selectedMonth.split('-')[1])}월`

  // 선택된 월 자체가 추첨권(가중치)의 대상 월이 되도록 처리 (예: 7월 경품 추첨 = 7월 기록 대상)
  const ticketSourceMonthLabel = useMemo(() => {
    const [, month] = selectedMonth.split('-').map(Number)
    return `${month}월`
  }, [selectedMonth])

  // ===== 추첨 로직 =====
  const handleDraw = async () => {
    if (!confirm(`${monthLabel} 추첨을 실행하시겠습니까? (이미 당첨자가 있으면 추가됩니다)`)) return
    setIsDrawing(true)
    setDrawAnimation(true)

    try {
      // 1. 모든 프로필 조회 (닉네임 유실 방지용)
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, nickname')

      const profileMap: Record<string, string> = {}
      for (const p of allProfiles || []) {
        profileMap[p.id] = p.nickname
      }

      // 2. 선택된 월(Target Month) REGULAR 런 참가자 가중치 계산
      const [year, month] = selectedMonth.split('-').map(Number)
      const targetDate = new Date(year, month - 1, 1)
      const targetYear = targetDate.getFullYear()
      const targetMonthVal = String(targetDate.getMonth() + 1).padStart(2, '0')
      const targetMonthStr = `${targetYear}-${targetMonthVal}`

      const startOfPrevMonth = `${targetMonthStr}-01`
      const endDayOfPrevMonth = new Date(targetYear, targetDate.getMonth() + 1, 0).getDate()
      const endOfPrevMonth = `${targetMonthStr}-${String(endDayOfPrevMonth).padStart(2, '0')}`

      const { data: records } = await (supabase as any)
        .from('running_records')
        .select('user_id, run_type')
        .eq('run_type', 'REGULAR')
        .gte('run_date', startOfPrevMonth)
        .lte('run_date', endOfPrevMonth)

      // 3. 유저별 참가 횟수 집계 → 추첨권 계산
      const countMap: Record<string, { count: number; nickname: string }> = {}
      for (const r of records || []) {
        const uid = r.user_id
        if (!countMap[uid]) {
          countMap[uid] = { count: 0, nickname: profileMap[uid] || '러너' }
        }
        countMap[uid].count++
      }

      // 4. 풀 만들기 (가중치: 참석 횟수가 곧 추첨권 수!)
      const pool: { userId: string; nickname: string; tickets: number }[] = []
      for (const [uid, info] of Object.entries(countMap)) {
        const tickets = info.count
        if (tickets > 0) pool.push({ userId: uid, nickname: info.nickname, tickets })
      }

      if (pool.length === 0) {
        alert('지난달(전월) 정기런 참가자가 없어 추첨을 진행할 수 없습니다.')
        setIsDrawing(false)
        setDrawAnimation(false)
        return
      }

      // 5. 가중치 풀 생성
      const weightedPool: { userId: string; nickname: string; tickets: number }[] = []
      for (const entry of pool) {
        for (let i = 0; i < entry.tickets; i++) {
          weightedPool.push(entry)
        }
      }

      // 5. 이미 당첨된 사람 제외하고 2명 추첨
      const alreadyWon = new Set(drawResults.map(d => d.winner_user_id))
      const eligible = weightedPool.filter(e => !alreadyWon.has(e.userId))

      if (eligible.length === 0) {
        alert('추첨 가능한 인원이 없습니다.')
        setIsDrawing(false)
        setDrawAnimation(false)
        return
      }

      const winners: typeof pool = []
      const usedIds = new Set<string>()
      const needed = Math.min(2 - drawResults.length, eligible.length)

      // 중복 없이 추첨
      for (let i = 0; i < needed * 100 && winners.length < needed; i++) {
        const idx = Math.floor(Math.random() * eligible.length)
        const candidate = eligible[idx]
        if (!usedIds.has(candidate.userId)) {
          usedIds.add(candidate.userId)
          winners.push(candidate)
        }
      }

      // 6. DB 저장
      for (const winner of winners) {
        const { error: insErr } = await (supabase as any).from('lucky_draw_results').insert({
          target_month: selectedMonth,
          winner_user_id: winner.userId,
          winner_nickname: winner.nickname,
          tickets_count: winner.tickets,
        })
        if (insErr) {
          throw new Error(`DB 저장 실패: ${insErr.message} (${insErr.code || ''})`)
        }
      }

      // 7. 결과 갱신
      const { data: newResults, error: selErr } = await (supabase as any)
        .from('lucky_draw_results')
        .select('*')
        .eq('target_month', selectedMonth)
        .order('created_at', { ascending: true })

      if (selErr) {
        throw new Error(`DB 조회 실패: ${selErr.message}`)
      }

      setTimeout(() => {
        setDrawResults(newResults || [])
        setDrawAnimation(false)
        setIsDrawing(false)
      }, 1500)
    } catch (err: any) {
      alert('추첨 중 오류가 발생했습니다: ' + (err.message || JSON.stringify(err)))
      setIsDrawing(false)
      setDrawAnimation(false)
    }
  }



  return (
    <div className="min-h-screen bg-white px-4 py-8 text-gray-900 pb-24 font-sans">
      <div className="mx-auto max-w-lg space-y-6">

        {/* 헤더 */}
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <Link href="/dashboard" className="p-2 rounded-2xl bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">크루 라운지</h1>
            <p className="text-xs text-gray-500 mt-0.5">이벤트 참여</p>
          </div>
        </div>

        {/* ===== 섹션 1: 이달의 정기런 추첨 ===== */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-950">🎰 {monthLabel} 경품 추첨</h2>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    {availableMonths.map((m) => {
                      const [yr, mn] = m.split('-')
                      return (
                        <option key={m} value={m}>
                          {yr}년 {parseInt(mn)}월
                        </option>
                      )
                    })}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{ticketSourceMonthLabel} 정기런 참가 횟수에 따라 당첨 확률이 달라집니다</p>
              </div>
              {isAdmin && drawResults.length < 2 && (
                <button
                  onClick={handleDraw}
                  disabled={isDrawing}
                  className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-4 py-2 text-xs font-bold text-gray-900 disabled:opacity-60 hover:bg-[#b8e600] active:scale-95 transition-all self-start sm:self-auto"
                >
                  {isDrawing ? '추첨 중...' : '추첨 실행'}
                </button>
              )}
            </div>

            {/* 가중치 안내 */}
            <div className="mt-3 p-4 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-center">
              <p className="text-xs font-bold text-gray-900">
                🎫 {ticketSourceMonthLabel} 정기런(벙) 참석 1회당 추첨권 1장 지급!
              </p>
              <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                많이 참석할수록 가중치가 높아져 경품 당첨 확률이 더 커집니다.
              </p>
            </div>
          </div>

          <div className="p-5">
            {drawAnimation && (
              <div className="text-center py-8">
                <div className="inline-block animate-bounce text-4xl mb-2">🎰</div>
                <p className="text-sm text-gray-900 font-bold animate-pulse">추첨을 진행하고 있습니다...</p>
              </div>
            )}

            {!drawAnimation && drawResults.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p>아직 {monthLabel} 추첨 결과가 없습니다.</p>
                {isAdmin && <p className="text-xs mt-1 text-gray-500">추첨 실행 버튼을 눌러 추첨을 실행해 주세요.</p>}
              </div>
            )}

            {!drawAnimation && drawResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{monthLabel} 당첨자 🎉</p>
                {drawResults.map((result, idx) => (
                  <div key={result.id} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#CCFF00] border border-[#b8e600] text-sm font-bold text-gray-900">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-950 text-sm">{result.winner_nickname}</p>
                      <p className="text-xs text-gray-500 mt-0.5">추첨권 {result.tickets_count}장으로 당첨!</p>
                    </div>
                    <div className="ml-auto text-xl">🏆</div>
                  </div>
                ))}
                {drawResults.length < 2 && isAdmin && (
                  <p className="text-xs text-center text-gray-500">1명 더 추첨 가능합니다.</p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
