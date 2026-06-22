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
  const supabase = createClient() as any
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
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 등록 폼 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-950 mb-4">새 일정 등록</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">일정 제목 <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 6월 1주차 정기런" className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">날짜 <span className="text-red-500">*</span></label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none [color-scheme:light]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">시간</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none [color-scheme:light]" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-gray-500 mb-1">장소 선택</label>
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
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
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
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none" 
                  />
                )}
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-gray-500 mb-1">구분</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none">
                <option value="REGULAR">정기런</option>
                <option value="TRAINING">훈련벙</option>
                <option value="EVENT">이벤트</option>
                <option value="ETC">기타</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-[#CCFF00] border border-[#b8e600] text-gray-900 font-bold rounded-2xl hover:bg-[#b8e600] transition-all active:scale-[0.98]">
              {isSubmitting ? '등록 중...' : '일정 등록하기'}
            </button>
          </div>
        </form>
      </div>

      {/* 리스트 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-950 mb-4">최근 등록된 일정</h3>
        <div className="space-y-3">
          {schedules.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-2xl">{s.schedule_type}</span>
                  <span className="font-bold text-gray-900">{s.title}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {s.start_date} {s.time && `· ${s.time}`} {s.location && `· 📍 ${s.location}`}
                </div>
              </div>
              <button onClick={() => handleDelete(s.id)} className="text-xs text-red-600 bg-white hover:bg-red-50 px-3 py-1.5 rounded-2xl border border-red-200 transition-all active:scale-95">삭제</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
