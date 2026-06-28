'use client'

import React, { useState } from 'react'
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

  // 추첨 관련 상태
  const [drawResults, setDrawResults] = useState<DrawResult[]>(initialDrawResults)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawAnimation, setDrawAnimation] = useState(false)



  const monthLabel = `${currentMonth.split('-')[0]}년 ${parseInt(currentMonth.split('-')[1])}월`

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

      // 2. 이번달 REGULAR 런 참가자 가중치 계산
      const startOfMonth = `${currentMonth}-01`
      const endDay = new Date(parseInt(currentMonth.split('-')[0]), parseInt(currentMonth.split('-')[1]), 0).getDate()
      const endOfMonth = `${currentMonth}-${String(endDay).padStart(2, '0')}`

      const { data: records } = await (supabase as any)
        .from('running_records')
        .select('user_id, run_type')
        .eq('run_type', 'REGULAR')
        .gte('run_date', startOfMonth)
        .lte('run_date', endOfMonth)

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
        alert('이번 달 정기런 참가자가 없어 추첨을 진행할 수 없습니다.')
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
        await (supabase as any).from('lucky_draw_results').insert({
          target_month: currentMonth,
          winner_user_id: winner.userId,
          winner_nickname: winner.nickname,
          tickets_count: winner.tickets,
        })
      }

      // 7. 결과 갱신
      const { data: newResults } = await (supabase as any)
        .from('lucky_draw_results')
        .select('*')
        .eq('target_month', currentMonth)
        .order('created_at', { ascending: true })

      setTimeout(() => {
        setDrawResults(newResults || [])
        setDrawAnimation(false)
        setIsDrawing(false)
      }, 1500)
    } catch (err) {
      console.error(err)
      alert('추첨 중 오류가 발생했습니다.')
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
            <p className="text-xs text-gray-500 mt-0.5">이벤트 참여 및 코스 정보 확인</p>
          </div>
        </div>

        {/* ===== 섹션 1: 이달의 정기런 추첨 ===== */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-950">🎰 {monthLabel} 경품 추첨</h2>
                <p className="text-xs text-gray-500 mt-0.5">정기런 참가 횟수에 따라 당첨 확률이 달라집니다</p>
              </div>
              {isAdmin && drawResults.length < 2 && (
                <button
                  onClick={handleDraw}
                  disabled={isDrawing}
                  className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-4 py-2 text-xs font-bold text-gray-900 disabled:opacity-60 hover:bg-[#b8e600] active:scale-95 transition-all"
                >
                  {isDrawing ? '추첨 중...' : '추첨 실행'}
                </button>
              )}
            </div>

            {/* 가중치 안내 */}
            <div className="mt-3 p-4 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-center">
              <p className="text-xs font-bold text-gray-900">
                🎫 정기런(벙) 참석 1회당 추첨권 1장 지급!
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
                <p>아직 이번 달 추첨 결과가 없습니다.</p>
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

        {/* ===== 섹션 2: GPX 코스 라운지 이동 링크 ===== */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-2xl flex-shrink-0">
              🗺️
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950">코스 GPX 라운지</h2>
              <p className="text-xs text-gray-500 mt-1">GPS 코스 파일을 다운받고 달려보세요!</p>
            </div>
          </div>
          <Link
            href="/gpx"
            className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-4 py-2.5 text-xs font-bold text-gray-900 hover:bg-[#b8e600] active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            이동하기
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
