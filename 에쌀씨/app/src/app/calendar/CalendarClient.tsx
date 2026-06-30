'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface CalendarClientProps {
  userRole: string
}

export default function CalendarClient({ userRole }: CalendarClientProps) {
  const supabase = createClient()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    const fetchCalendarImage = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('setting_key', 'calendar_image_url')
          .single()

        if (data) {
          setImageUrl((data as any).setting_value)
        } else {
          setImageUrl(null)
        }
      } catch (err) {
        console.error('Failed to fetch calendar image setting:', err)
        setImageUrl(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCalendarImage()
  }, [supabase])

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-8 pb-24 font-sans">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">크루 일정 📅</h1>
          </div>
          <Link href="/dashboard" className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95">
            돌아가기
          </Link>
        </div>

        {/* 일정표 내용 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
            <p className="text-xs text-gray-400 font-semibold">일정표를 불러오는 중입니다...</p>
          </div>
        ) : imageUrl ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* 상단 액션 바 */}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-gray-400 font-bold">이미지를 누르면 크게 확대할 수 있습니다.</span>
              <a
                href={imageUrl}
                download="crew_schedule.png"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all active:scale-95 flex items-center gap-1.5"
              >
                📥 원본 저장
              </a>
            </div>

            {/* 일정표 이미지 카드 */}
            <div 
              onClick={() => setIsZoomed(true)}
              className="rounded-2xl border border-gray-200 bg-white p-3 shadow-md cursor-pointer hover:border-gray-300 transition-all duration-300 active:scale-[0.99] group overflow-hidden"
            >
              <div className="relative rounded-xl overflow-hidden bg-gray-50">
                <img 
                  src={imageUrl} 
                  alt="Crew Calendar Schedule" 
                  className="w-full max-h-[500px] object-contain rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-[1.01]" 
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center">
                  <span className="text-white bg-black/60 px-3 py-1.5 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    🔍 크게 보기
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center p-6 space-y-3 animate-in fade-in">
            <span className="text-4xl">📅</span>
            <p className="text-sm font-bold text-gray-500">등록된 크루 일정이 없습니다.</p>
            <p className="text-xs text-gray-400">운영진이 일정표 이미지를 등록할 때까지 잠시만 기다려주세요.</p>
          </div>
        )}

      </div>

      {/* 줌/크게 보기 풀스크린 오버레이 */}
      {isZoomed && imageUrl && (
        <div 
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsZoomed(false) }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center text-lg font-bold border border-white/20"
            >
              ✕
            </button>
          </div>
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-2xl max-h-[85vh] overflow-auto flex items-center justify-center rounded-2xl relative select-none"
          >
            <img 
              src={imageUrl} 
              alt="Zoomed Schedule" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" 
            />
          </div>
          <p className="absolute bottom-6 text-xs text-white/60 font-medium">화면의 아무 곳이나 누르면 닫힙니다.</p>
        </div>
      )}
    </div>
  )
}
