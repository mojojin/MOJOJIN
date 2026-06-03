'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type RunningRecord = Database['public']['Tables']['running_records']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface RecordViewerProps {
  initialRecords: RunningRecord[]
  profiles: Profile[]
}

export default function RecordViewer({ initialRecords, profiles }: RecordViewerProps) {
  const supabase = createClient() as any
  const [records, setRecords] = useState<RunningRecord[]>(initialRecords)
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  
  // 편집 모달 상태
  const [editingRecord, setEditingRecord] = useState<RunningRecord | null>(null)
  const [editDistance, setEditDistance] = useState<number>(0)
  const [editDate, setEditDate] = useState<string>('')
  const [editLocation, setEditLocation] = useState<string>('')
  const [editRunType, setEditRunType] = useState<'PERSONAL' | 'REGULAR'>('PERSONAL')
  const [editIsPacing, setEditIsPacing] = useState<boolean>(false)

  // 특정 년/월의 시작일과 종료일 계산
  const getMonthDateRange = (date: Date) => {
    const y = date.getFullYear()
    const m = date.getMonth()
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0)

    const format = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      start: format(start),
      end: format(end),
    }
  }

  // 데이터 로딩
  const fetchRecords = useCallback(async (date: Date) => {
    setIsLoading(true)
    const { start, end } = getMonthDateRange(date)

    try {
      const { data, error } = await supabase
        .from('running_records')
        .select('*')
        .gte('run_date', start)
        .lte('run_date', end)
        .order('run_date', { ascending: false })

      if (error) throw error
      setRecords(data ?? [])
    } catch (err) {
      console.error('Failed to fetch records:', err)
      alert('기록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // 월 이동
  const handlePrevMonth = () => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    setCurrentDate(nextDate)
    fetchRecords(nextDate)
  }

  const handleNextMonth = () => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    setCurrentDate(nextDate)
    fetchRecords(nextDate)
  }

  // 삭제
  const handleDelete = async (record: RunningRecord) => {
    const userNickname = profiles.find((p) => p.id === record.user_id)?.nickname || '알 수 없는 크루원'
    const confirmMsg = `${userNickname}님의 ${record.run_date} (${record.distance_km}km) 기록을 정말 삭제하시겠습니까?`
    if (!confirm(confirmMsg)) return

    setActionInProgress(record.id)
    try {
      const { error } = await supabase
        .from('running_records')
        .delete()
        .eq('id', record.id)

      if (error) throw error
      setRecords((prev) => prev.filter((r) => r.id !== record.id))
    } catch (err) {
      console.error('Failed to delete record:', err)
      alert('기록 삭제 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  // 수정 시작
  const openEditModal = (record: RunningRecord) => {
    setEditingRecord(record)
    setEditDistance(record.distance_km)
    setEditDate(record.run_date)
    setEditLocation(record.location_name_snapshot)
    setEditRunType(record.run_type)
    setEditIsPacing(record.is_pacing)
  }

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editingRecord) return
    
    if (editDistance <= 0 || !editDate || !editLocation.trim()) {
      alert('모든 필수 항목(거리, 날짜, 장소)을 올바르게 입력해주세요.')
      return
    }

    setActionInProgress('saving_edit')
    try {
      const updates = {
        distance_km: Number(editDistance),
        run_date: editDate,
        location_name_snapshot: editLocation.trim(),
        run_type: editRunType,
        is_pacing: editIsPacing,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('running_records')
        .update(updates)
        .eq('id', editingRecord.id)

      if (error) throw error

      setRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, ...updates } : r))
      setEditingRecord(null)
    } catch (err) {
      console.error('Failed to update record:', err)
      alert('기록 수정 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  const getNickname = (userId: string) => {
    const p = profiles.find((profile) => profile.id === userId)
    return p ? p.nickname : '알 수 없는 사용자'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 편집 모달 */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gray-900/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight">📝 러닝 기록 수정 (관리자)</h2>
              <button
                onClick={() => setEditingRecord(null)}
                className="rounded-full bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 pl-1 block mb-1">거리 (km)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editDistance}
                    onChange={(e) => setEditDistance(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 pl-1 block mb-1">날짜</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 pl-1 block mb-1">장소명</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 pl-1 block mb-1">인증 구분</label>
                  <select
                    value={editRunType}
                    onChange={(e) => setEditRunType(e.target.value as 'PERSONAL' | 'REGULAR')}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                  >
                    <option value="REGULAR">정기 벙</option>
                    <option value="PERSONAL">개인런</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <input
                      type="checkbox"
                      checked={editIsPacing}
                      onChange={(e) => setEditIsPacing(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <span className="text-sm font-bold text-gray-300">페이싱 여부</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSaveEdit}
                disabled={actionInProgress === 'saving_edit'}
                className="mt-4 w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-extrabold text-sm transition-all"
              >
                {actionInProgress === 'saving_edit' ? '저장 중...' : '수정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 월 네비게이터 */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-sm p-4 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-[0.95]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-white">
            📅 {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </span>
          {isLoading && (
            <svg className="animate-spin h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
        </div>

        <button
          onClick={handleNextMonth}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-[0.95]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 기록 목록 */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            🏃 크루원 전체 러닝 기록
          </h2>
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-bold text-gray-400">
            총 {records.length}개
          </span>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-3xl mb-3">👟</span>
            <p className="text-sm text-gray-500 font-medium">선택한 월에 등록된 러닝 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {records.map((rec) => {
              const inProgress = actionInProgress === rec.id

              return (
                <div key={rec.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group">
                  <div className="space-y-1.5 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {getNickname(rec.user_id)}
                      </span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        {rec.distance_km.toFixed(1)}km
                      </span>
                      {rec.run_type === 'REGULAR' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                          정기 벙 🏃
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[9px] font-bold text-sky-400">
                          개인런 👟
                        </span>
                      )}
                      {rec.is_pacing && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                          페이서 🏅
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{rec.run_date}</span>
                      <span>•</span>
                      <span>{rec.location_name_snapshot}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(rec)}
                      disabled={inProgress}
                      className="rounded-xl border border-transparent p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                      aria-label="기록 수정"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(rec)}
                      disabled={inProgress}
                      className="rounded-xl border border-transparent p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all disabled:opacity-50"
                      aria-label="기록 삭제"
                    >
                      {inProgress ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
