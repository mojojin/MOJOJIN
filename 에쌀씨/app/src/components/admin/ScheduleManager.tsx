'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type Schedule = Database['public']['Tables']['schedules']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Location = Database['public']['Tables']['locations']['Row']

interface ScheduleManagerProps {
  userId: string
  locations?: Location[]
}

export default function ScheduleManager({ userId, locations = [] }: ScheduleManagerProps) {
  const supabase = createClient()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 폼 상태
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [selectedLocId, setSelectedLocId] = useState('')
  const [type, setType] = useState('REGULAR')

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(50)
    
    if (data) setSchedules(data)
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !startDate) return alert('제목과 날짜는 필수입니다.')

    setIsSubmitting(true)
    const { error } = await supabase
      .from('schedules')
      .insert({
        title,
        start_date: startDate,
        time: time || null,
        location: location || null,
        schedule_type: type,
        created_by: userId
      })

    if (error) {
      alert('일정 등록 실패')
      console.error(error)
    } else {
      alert('등록 완료')
      setTitle('')
      setStartDate('')
      setTime('')
      setLocation('')
      setSelectedLocId('')
      fetchSchedules()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('schedules').delete().eq('id', id)
    setSchedules(schedules.filter(s => s.id !== id))
  }

  const activeLocations = locations.filter(loc => loc.is_active)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 등록 폼 */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/40 p-6">
        <h3 className="text-lg font-bold text-white mb-4">새 일정 등록</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">일정 제목 <span className="text-amber-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 6월 1주차 정기런" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">날짜 <span className="text-amber-500">*</span></label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">시간</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white [color-scheme:dark]" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs text-gray-400 mb-1">장소 선택</label>
              <div className="space-y-2">
                <select 
                  value={selectedLocId} 
                  onChange={e => {
                    const val = e.target.value
                    setSelectedLocId(val)
                    if (val && val !== 'custom') {
                      setLocation(val)
                    } else if (val === '') {
                      setLocation('')
                    }
                  }} 
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
                >
                  <option value="">장소 선택 (등록된 장소)</option>
                  {activeLocations.map(loc => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                  <option value="custom">직접 입력...</option>
                </select>
                {(selectedLocId === 'custom' || (location && !activeLocations.some(loc => loc.name === location))) && (
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    placeholder="장소 직접 입력" 
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" 
                  />
                )}
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs text-gray-400 mb-1">구분</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white">
                <option value="REGULAR">정기런</option>
                <option value="TRAINING">훈련벙</option>
                <option value="EVENT">이벤트</option>
                <option value="ETC">기타</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors">
              {isSubmitting ? '등록 중...' : '일정 등록하기'}
            </button>
          </div>
        </form>
      </div>

      {/* 리스트 */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/40 p-6">
        <h3 className="text-lg font-bold text-white mb-4">최근 등록된 일정</h3>
        <div className="space-y-3">
          {schedules.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{s.schedule_type}</span>
                  <span className="font-bold text-white">{s.title}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {s.start_date} {s.time && `· ${s.time}`} {s.location && `· 📍 ${s.location}`}
                </div>
              </div>
              <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">삭제</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
