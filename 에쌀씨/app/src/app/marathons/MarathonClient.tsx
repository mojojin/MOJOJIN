'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MarathonPBCard from '@/components/marathon/MarathonPBCard'

interface MarathonEvent {
  id: string
  name: string
  event_date: string
  location: string | null
  description: string | null
  courses: string[]
  registration_start: string | null
  registration_end: string | null
  is_active: boolean
}

interface Participant {
  id: string
  user_id: string
  event_id: string | null
  marathon_name: string
  marathon_date: string
  course: string
  profiles: { nickname: string }
  marathon_events?: { name: string; event_date: string } | null
}

interface MarathonClientProps {
  userId: string
  isAdmin: boolean
  initialEvents: MarathonEvent[]
  initialParticipants: Participant[]
  initialPBs: any[]
}

export default function MarathonClient({
  userId,
  isAdmin,
  initialEvents,
  initialParticipants,
  initialPBs,
}: MarathonClientProps) {
  const supabase = createClient()

  const [events, setEvents] = useState<MarathonEvent[]>(initialEvents)
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
  const [activeTab, setActiveTab] = useState<'events' | 'participants' | 'pbs'>('events')

  // 참가 등록 상태
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 관리자: 이벤트 추가 상태
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [newEventName, setNewEventName] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [newEventCourses, setNewEventCourses] = useState('5K,10K,Half,Full')
  const [newEventRegStart, setNewEventRegStart] = useState('')
  const [newEventRegEnd, setNewEventRegEnd] = useState('')
  const [isEventSubmitting, setIsEventSubmitting] = useState(false)

  const selectedEvent = events.find(e => e.id === selectedEventId)

  const fetchData = async () => {
    const { data: evts } = await (supabase as any)
      .from('marathon_events')
      .select('*')
      .eq('is_active', true)
      .order('event_date', { ascending: true })
    setEvents(evts || [])

    const { data: parts } = await (supabase as any)
      .from('marathon_participants')
      .select('*, profiles(nickname), marathon_events(name, event_date)')
      .order('created_at', { ascending: false })
    setParticipants(parts || [])
  }

  // 참가 등록
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId || !selectedCourse) return
    setIsSubmitting(true)

    const event = events.find(ev => ev.id === selectedEventId)
    if (!event) { setIsSubmitting(false); return }

    const { error } = await (supabase as any).from('marathon_participants').insert({
      user_id: userId,
      event_id: selectedEventId,
      marathon_name: event.name,
      marathon_date: event.event_date,
      course: selectedCourse,
    })

    if (error) {
      alert('등록 중 오류가 발생했습니다.')
    } else {
      setIsRegisterOpen(false)
      setSelectedEventId('')
      setSelectedCourse('')
      fetchData()
    }
    setIsSubmitting(false)
  }

  // 참가 취소
  const handleDelete = async (id: string) => {
    if (!confirm('참가를 취소하시겠습니까?')) return
    await (supabase as any).from('marathon_participants').delete().eq('id', id)
    setParticipants(prev => prev.filter(p => p.id !== id))
  }

  // 관리자: 이벤트 등록
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventName || !newEventDate) return
    setIsEventSubmitting(true)

    const coursesArr = newEventCourses.split(',').map(c => c.trim()).filter(Boolean)

    const { error } = await (supabase as any).from('marathon_events').insert({
      name: newEventName,
      event_date: newEventDate,
      location: newEventLocation || null,
      description: newEventDesc || null,
      courses: coursesArr,
      registration_start: newEventRegStart || null,
      registration_end: newEventRegEnd || null,
      is_active: true,
    })

    if (error) {
      alert('이벤트 등록 오류: ' + error.message)
    } else {
      setIsEventFormOpen(false)
      setNewEventName('')
      setNewEventDate('')
      setNewEventLocation('')
      setNewEventDesc('')
      setNewEventCourses('5K,10K,Half,Full')
      setNewEventRegStart('')
      setNewEventRegEnd('')
      fetchData()
    }
    setIsEventSubmitting(false)
  }

  // 관리자: 이벤트 비활성화
  const handleDeactivateEvent = async (id: string) => {
    if (!confirm('이 대회를 비활성화(숨김)하시겠습니까?')) return
    await (supabase as any).from('marathon_events').update({ is_active: false }).eq('id', id)
    setEvents(prev => prev.filter(ev => ev.id !== id))
  }

  // 대회별 참가자 그룹핑
  const grouped = events.map(event => ({
    event,
    participants: participants.filter(p => p.event_id === event.id || p.marathon_name === event.name),
  })).filter(g => g.participants.length > 0)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f2027] to-[#132830] px-4 py-8 text-gray-200 pb-24 font-sans">
      <div className="mx-auto max-w-lg space-y-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all active:scale-95 group">
              <svg className="transition-transform group-active:-translate-x-1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <h1 className="text-xl font-bold text-white">🏅 마라톤</h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={() => setIsEventFormOpen(true)}
                className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-400"
              >
                + 대회 등록
              </button>
            )}
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-400"
            >
              + 참가 신청
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              activeTab === 'events'
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/10'
            }`}
          >
            📋 대회 일정
          </button>
          <button
            onClick={() => setActiveTab('pbs')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              activeTab === 'pbs'
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/10'
            }`}
          >
            🏅 최고기록
          </button>
        </div>

        {/* 대회 일정 탭 */}
        {activeTab === 'events' && (
          <>
            {events.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">📋 확정된 대회 일정</h2>
                {events.map(event => {
                  const isPast = event.event_date < today
                  const myEntry = participants.find(p => p.user_id === userId && (p.event_id === event.id || p.marathon_name === event.name))
                  const eventParticipants = participants.filter(p => p.event_id === event.id || p.marathon_name === event.name)
                  return (
                    <div key={event.id} className={`rounded-2xl border ${isPast ? 'border-white/5 bg-gray-900/30 opacity-60' : 'border-white/10 bg-gray-900/50'} overflow-hidden`}>
                      <div className="px-4 py-3 flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white text-sm">{event.name}</h3>
                          <p className="text-xs text-amber-400 mt-0.5">🗓 {event.event_date}{event.location && ` · 📍 ${event.location}`}</p>
                          {event.description && <p className="text-xs text-gray-400 mt-1">{event.description}</p>}
                          {event.registration_start && event.registration_end && (
                            <p className="text-xs text-blue-400 mt-0.5">접수: {event.registration_start} ~ {event.registration_end}</p>
                          )}
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {event.courses.map(c => (
                              <span key={c} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">{c}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-bold text-gray-400 bg-black/40 px-2 py-1 rounded-lg">{eventParticipants.length}명</span>
                          {isAdmin && (
                            <button onClick={() => handleDeactivateEvent(event.id)} className="text-[10px] text-gray-600 hover:text-red-400">숨김</button>
                          )}
                        </div>
                      </div>
                      {eventParticipants.length > 0 && (
                        <div className="border-t border-white/5 px-4 py-3 flex flex-wrap gap-2">
                          {eventParticipants.map(p => (
                            <div key={p.id} className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5">
                              <span className="text-sm font-bold text-gray-200">{p.profiles.nickname}</span>
                              <span className="text-xs text-gray-500 font-mono bg-black/50 px-1.5 py-0.5 rounded">{p.course}</span>
                              {(p.user_id === userId || isAdmin) && (
                                <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 ml-0.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                {isAdmin ? '아직 등록된 대회가 없습니다. 대회를 등록해주세요!' : '현재 확정된 대회 일정이 없습니다.'}
              </div>
            )}
          </>
        )}

        {/* 최고기록 탭 */}
        {activeTab === 'pbs' && (
          <div className="pt-2">
            <MarathonPBCard userId={userId} initialPBs={initialPBs} />
          </div>
        )}

      </div>

      {/* 참가 신청 모달 */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gray-900 p-6">
            <h3 className="text-lg font-bold text-white mb-4">🏅 대회 참가 신청</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">대회 선택 *</label>
                <select
                  required
                  value={selectedEventId}
                  onChange={e => { setSelectedEventId(e.target.value); setSelectedCourse('') }}
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50"
                >
                  <option value="">대회를 선택하세요</option>
                  {events.filter(ev => ev.event_date >= today).map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} ({ev.event_date})</option>
                  ))}
                </select>
              </div>
              {selectedEvent && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">참가 코스 *</label>
                  <select
                    required
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50"
                  >
                    <option value="">코스 선택</option>
                    {selectedEvent.courses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsRegisterOpen(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-gray-400">취소</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black disabled:opacity-50">
                  {isSubmitting ? '등록 중...' : '신청'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 관리자: 대회 등록 모달 */}
      {isEventFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gray-900 p-6 my-4">
            <h3 className="text-lg font-bold text-white mb-4">📋 대회 일정 등록</h3>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">대회 이름 *</label>
                <input required type="text" value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="예) 2025 서울마라톤" className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">대회 날짜 *</label>
                <input required type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">장소</label>
                <input type="text" value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} placeholder="예) 광화문 광장" className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">설명</label>
                <textarea value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} rows={2} placeholder="대회 안내 사항" className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">코스 목록 (쉼표 구분)</label>
                <input type="text" value={newEventCourses} onChange={e => setNewEventCourses(e.target.value)} placeholder="5K,10K,Half,Full" className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">접수 시작일</label>
                  <input type="date" value={newEventRegStart} onChange={e => setNewEventRegStart(e.target.value)} className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">접수 종료일</label>
                  <input type="date" value={newEventRegEnd} onChange={e => setNewEventRegEnd(e.target.value)} className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsEventFormOpen(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-gray-400">취소</button>
                <button type="submit" disabled={isEventSubmitting} className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white disabled:opacity-50">
                  {isEventSubmitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
