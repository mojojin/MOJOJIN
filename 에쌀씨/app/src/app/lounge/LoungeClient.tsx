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

interface GpxCourse {
  id: string
  course_name: string
  description: string | null
  distance_km: number | null
  file_url: string
  file_name: string
  created_at: string
}

interface LoungeClientProps {
  userId: string
  userNickname: string
  isAdmin: boolean
  initialDrawResults: DrawResult[]
  initialGpxCourses: GpxCourse[]
  currentMonth: string
}

export default function LoungeClient({
  userId,
  userNickname,
  isAdmin,
  initialDrawResults,
  initialGpxCourses,
  currentMonth,
}: LoungeClientProps) {
  const supabase = createClient() as any

  // 추첨 관련 상태
  const [drawResults, setDrawResults] = useState<DrawResult[]>(initialDrawResults)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawAnimation, setDrawAnimation] = useState(false)

  // GPX 관련 상태
  const [gpxCourses, setGpxCourses] = useState<GpxCourse[]>(initialGpxCourses)
  const [isGpxFormOpen, setIsGpxFormOpen] = useState(false)
  const [gpxCourseName, setGpxCourseName] = useState('')
  const [gpxDescription, setGpxDescription] = useState('')
  const [gpxDistanceKm, setGpxDistanceKm] = useState('')
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [isGpxUploading, setIsGpxUploading] = useState(false)

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

  // ===== GPX 업로드 로직 =====
  const handleGpxUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gpxFile || !gpxCourseName) return
    setIsGpxUploading(true)

    try {
      // Supabase Storage에 업로드
      const fileExt = gpxFile.name.split('.').pop()
      const fileName = `${Date.now()}_${gpxCourseName.replace(/\s+/g, '_')}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gpx-files')
        .upload(fileName, gpxFile, { contentType: 'application/gpx+xml' })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('gpx-files').getPublicUrl(fileName)
      const fileUrl = publicUrlData.publicUrl

      // DB에 저장
      const { error: dbError } = await (supabase as any).from('gpx_courses').insert({
        course_name: gpxCourseName,
        description: gpxDescription || null,
        distance_km: gpxDistanceKm ? parseFloat(gpxDistanceKm) : null,
        file_url: fileUrl,
        file_name: gpxFile.name,
        uploaded_by: userId,
      })

      if (dbError) throw dbError

      // 목록 갱신
      const { data: newList } = await (supabase as any)
        .from('gpx_courses')
        .select('*')
        .order('created_at', { ascending: false })

      setGpxCourses(newList || [])
      setIsGpxFormOpen(false)
      setGpxCourseName('')
      setGpxDescription('')
      setGpxDistanceKm('')
      setGpxFile(null)
    } catch (err) {
      console.error('GPX upload error:', err)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsGpxUploading(false)
    }
  }

  const handleDeleteGpx = async (id: string) => {
    if (!confirm('정말 이 코스를 삭제하시겠습니까?')) return
    try {
      const course = gpxCourses.find(c => c.id === id)
      if (!course) return

      const urlParts = course.file_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      await supabase.storage.from('gpx-files').remove([fileName])

      const { error } = await (supabase as any).from('gpx_courses').delete().eq('id', id)
      if (error) throw error

      setGpxCourses(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Delete GPX error:', err)
      alert('코스 삭제 중 오류가 발생했습니다.')
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

        {/* ===== 섹션 2: GPX 코스 라운지 ===== */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-950">🗺️ 코스 GPX 라운지</h2>
                <p className="text-xs text-gray-500 mt-0.5">GPS 코스 파일을 다운로드하고 달려보세요!</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setIsGpxFormOpen(true)}
                  className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-4 py-2 text-xs font-bold text-gray-900 hover:bg-[#b8e600] active:scale-95 transition-all"
                >
                  코스 추가
                </button>
              )}
            </div>
          </div>

          <div className="p-5">
            {gpxCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p>등록된 코스가 없습니다.</p>
                {isAdmin && <p className="text-xs mt-1 text-gray-500">운영자 계정으로 코스를 등록하세요.</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {gpxCourses.map(course => (
                  <div key={course.id} className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-4 shadow-sm active:scale-[0.99] transition-all">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 text-2xl flex-shrink-0">
                      🗺️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-950 text-sm truncate">{course.course_name}</p>
                      {course.distance_km && (
                        <p className="text-xs text-gray-900 mt-0.5 font-bold">{course.distance_km}km 코스</p>
                      )}
                      {course.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{course.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={course.file_url}
                        download={course.file_name}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-3 py-2 text-xs font-bold text-gray-900 hover:bg-[#b8e600] active:scale-95 transition-all text-center flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        GPX
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteGpx(course.id)}
                          className="rounded-2xl border border-red-200 p-2 text-red-600 hover:bg-red-50 transition-all active:scale-95"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* GPX 업로드 모달 */}
      {isGpxFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in duration-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">코스 GPX 등록</h3>
            <form onSubmit={handleGpxUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">코스 이름 *</label>
                <input
                  required
                  type="text"
                  value={gpxCourseName}
                  onChange={e => setGpxCourseName(e.target.value)}
                  placeholder="예) 인계동 10K 코스"
                  className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">거리 (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={gpxDistanceKm}
                  onChange={e => setGpxDistanceKm(e.target.value)}
                  placeholder="예) 10.5"
                  className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">설명</label>
                <textarea
                  value={gpxDescription}
                  onChange={e => setGpxDescription(e.target.value)}
                  placeholder="코스에 대한 간단한 설명"
                  rows={2}
                  className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none resize-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">GPX 파일 *</label>
                <input
                  required
                  type="file"
                  accept=".gpx"
                  onChange={e => setGpxFile(e.target.files?.[0] || null)}
                  className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsGpxFormOpen(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-all">취소</button>
                <button type="submit" disabled={isGpxUploading} className="flex-1 rounded-2xl bg-[#CCFF00] border border-[#b8e600] py-3 text-sm font-bold text-gray-900 disabled:opacity-50 active:scale-[0.98] transition-all">
                  {isGpxUploading ? '업로드 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
