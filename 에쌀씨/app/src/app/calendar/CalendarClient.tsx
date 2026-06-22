'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type Schedule = Database['public']['Tables']['schedules']['Row']

interface CalendarClientProps {
  userRole: string
}

export default function CalendarClient({ userRole }: CalendarClientProps) {
  const supabase = createClient()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    const fetchSchedules = async () => {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)
      
      const format = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }

      const { data } = await supabase
        .from('schedules')
        .select('*')
        .gte('start_date', format(start))
        .lte('start_date', format(end))
        .order('start_date', { ascending: true })

      if (data) setSchedules(data)
    }
    fetchSchedules()
  }, [year, month, supabase])

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDay }, (_, i) => i)

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`

  const getScheduleStyle = (type: string) => {
    switch (type) {
      case 'REGULAR': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'TRAINING': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'EVENT': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getScheduleLabel = (type: string) => {
    switch (type) {
      case 'REGULAR': return '정기런'
      case 'TRAINING': return '훈련벙'
      case 'EVENT': return '이벤트'
      default: return '기타'
    }
  }

  const selectedDateSchedules = selectedDateStr 
    ? schedules.filter(s => s.start_date === selectedDateStr)
    : []

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-8 pb-24 font-sans">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">크루 일정</h1>
          </div>
          <Link href="/dashboard" className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors active:scale-95">
            돌아가기
          </Link>
        </div>

        {/* 캘린더 네비게이션 */}
        <div className="flex items-center justify-between px-2 pt-2">
          <button onClick={handlePrevMonth} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {year}년 {month + 1}월
          </h2>
          <button onClick={handleNextMonth} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* 캘린더 그리드 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div key={day} className={`text-[11px] font-bold pb-2 ${i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-400'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7 gap-1">
            {blanks.map(b => (
              <div key={`blank-${b}`} className="aspect-square p-1" />
            ))}
            {days.map(d => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDateStr
              const daySchedules = schedules.filter(s => s.start_date === dateStr)
              const hasSchedules = daySchedules.length > 0
              
              return (
                <div 
                  key={d} 
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`
                    relative aspect-square flex flex-col items-center pt-1.5 pb-1 px-0.5 rounded-2xl cursor-pointer transition-all border active:scale-[0.95]
                    ${isSelected 
                      ? 'bg-[#CCFF00] border-[#b8e600] shadow-sm' 
                      : hasSchedules
                        ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 hover:bg-[#CCFF00]/25'
                        : 'bg-transparent border-transparent hover:bg-gray-50'
                    }
                  `}
                >
                  <span className={`text-sm font-bold z-10 ${isToday ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {d}
                  </span>
                  
                  {/* 스케줄 닷 마커 */}
                  <div className="flex gap-0.5 mt-auto mb-1">
                    {daySchedules.slice(0, 3).map((s, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full ${s.schedule_type === 'REGULAR' ? 'bg-emerald-400' : s.schedule_type === 'TRAINING' ? 'bg-blue-400' : s.schedule_type === 'EVENT' ? 'bg-amber-400' : 'bg-gray-400'}`} />
                    ))}
                    {daySchedules.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 선택된 날짜 상세 일정 또는 전체 일정 */}
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-sm font-bold text-gray-500">
              {selectedDateStr 
                ? `${selectedDateStr.replace(/-/g, '.')} 일정` 
                : `${month + 1}월 전체 일정`
              }
            </h3>
            {selectedDateStr && (
              <button 
                onClick={() => setSelectedDateStr(null)}
                className="text-xs font-bold text-gray-900 hover:underline flex items-center gap-1"
              >
                전체 일정 보기
              </button>
            )}
          </div>
          
          {(selectedDateStr ? selectedDateSchedules : schedules).length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
              등록된 일정이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {(selectedDateStr ? selectedDateSchedules : schedules).map(s => (
                <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-4 flex gap-4 hover:bg-gray-50 transition-all active:scale-[0.99] shadow-sm">
                  <div className="flex flex-col items-center justify-center shrink-0 w-16 border-r border-gray-100 pr-4 text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{getScheduleLabel(s.schedule_type)}</span>
                    <span className="text-sm font-black text-gray-900 mt-1">{s.start_date.substring(5).replace(/-/g, '/')}</span>
                    <span className="text-[10px] font-semibold text-gray-500 mt-0.5">{s.time || '종일'}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-base font-bold text-gray-900 leading-tight">{s.title}</h4>
                    {s.location && (
                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                        <span>📍</span> <span>{s.location}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
