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
  created_by?: string | null
  creator?: { nickname: string } | null
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
  const [activeTab, setActiveTab] = useState<'events' | 'pbs' | 'manage'>('events')

  // 참가 등록 상태
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 관리자: 이벤트 추가 상태
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [customCourseInput, setCustomCourseInput] = useState('')
  const [customCourseInputEdit, setCustomCourseInputEdit] = useState('')
  const [newEventName, setNewEventName] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [newEventCourses, setNewEventCourses] = useState<string[]>(['5km', '10km', '하프', '풀', '서포터즈'])
  const [newEventRegStart, setNewEventRegStart] = useState('')
  const [newEventRegEnd, setNewEventRegEnd] = useState('')
  const [isEventSubmitting, setIsEventSubmitting] = useState(false)

  // 관리자: 이벤트 수정 상태
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editEventName, setEditEventName] = useState('')
  const [editEventDate, setEditEventDate] = useState('')
  const [editEventLocation, setEditEventLocation] = useState('')
  const [editEventDesc, setEditEventDesc] = useState('')
  const [editEventCourses, setEditEventCourses] = useState<string[]>([])
  const [editEventRegStart, setEditEventRegStart] = useState('')
  const [editEventRegEnd, setEditEventRegEnd] = useState('')
  const [editEventIsActive, setEditEventIsActive] = useState(true)

  const selectedEvent = events.find(e => e.id === selectedEventId)

  const handleOpenRegisterForEvent = (eventId: string) => {
    setSelectedEventId(eventId)
    setSelectedCourse('')
    setIsRegisterOpen(true)
  }

  const handleAddCustomCourse = () => {
    const trimmed = customCourseInput.trim()
    if (!trimmed) return
    if (!newEventCourses.includes(trimmed)) {
      setNewEventCourses([...newEventCourses, trimmed])
    }
    setCustomCourseInput('')
  }

  const handleAddCustomCourseEdit = () => {
    const trimmed = customCourseInputEdit.trim()
    if (!trimmed) return
    if (!editEventCourses.includes(trimmed)) {
      setEditEventCourses([...editEventCourses, trimmed])
    }
    setCustomCourseInputEdit('')
  }

  const fetchData = async () => {
    let query = (supabase as any).from('marathon_events').select('*, creator:profiles!marathon_events_created_by_fkey(nickname)')
    if (!isAdmin) {
      query = query.eq('is_active', true)
    }
    const { data: evts } = await query.order('event_date', { ascending: true })
    setEvents(evts || [])

    const { data: parts } = await (supabase as any)
      .from('marathon_participants')
      .select('*, profiles(nickname), marathon_events(name, event_date)')
      .order('created_at', { ascending: false })
    setParticipants(parts || [])
  }

  const handleOpenEdit = (event: MarathonEvent) => {
    setEditingEventId(event.id)
    setEditEventName(event.name)
    setEditEventDate(event.event_date)
    setEditEventLocation(event.location || '')
    setEditEventDesc(event.description || '')
    setEditEventCourses(event.courses || [])
    setEditEventRegStart(event.registration_start || '')
    setEditEventRegEnd(event.registration_end || '')
    setEditEventIsActive(event.is_active)
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEventId || !editEventName || !editEventDate) return
    setIsEventSubmitting(true)

    const { error } = await (supabase as any)
      .from('marathon_events')
      .update({
        name: editEventName,
        event_date: editEventDate,
        location: editEventLocation || null,
        description: editEventDesc || null,
        courses: editEventCourses,
        registration_start: editEventRegStart || null,
        registration_end: editEventRegEnd || null,
        is_active: editEventIsActive,
      })
      .eq('id', editingEventId)

    if (error) {
      alert('대회 수정 오류: ' + error.message)
    } else {
      setEditingEventId(null)
      fetchData()
    }
    setIsEventSubmitting(false)
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('정말로 이 대회를 영구 삭제하시겠습니까? 관련 참가 신청 내역도 전부 삭제됩니다.')) return
    
    // 1. 외래키 제약조건 위배 방지를 위해 대회 참가자 먼저 삭제
    const { error: partDeleteError } = await (supabase as any)
      .from('marathon_participants')
      .delete()
      .eq('event_id', id)

    if (partDeleteError) {
      alert('참가 목록 삭제 오류: ' + partDeleteError.message)
      return
    }

    // 2. 대회 삭제
    const { error } = await (supabase as any)
      .from('marathon_events')
      .delete()
      .eq('id', id)

    if (error) {
      alert('대회 삭제 오류: ' + error.message)
    } else {
      fetchData()
    }
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

    const { error } = await (supabase as any).from('marathon_events').insert({
      name: newEventName,
      event_date: newEventDate,
      location: newEventLocation || null,
      description: newEventDesc || null,
      courses: newEventCourses,
      registration_start: newEventRegStart || null,
      registration_end: newEventRegEnd || null,
      is_active: true,
      created_by: userId,
    })

    if (error) {
      alert('이벤트 등록 오류: ' + error.message)
    } else {
      setIsEventFormOpen(false)
      setNewEventName('')
      setNewEventDate('')
      setNewEventLocation('')
      setNewEventDesc('')
      setNewEventCourses(['5km', '10km', '하프', '풀'])
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
    <div className="min-h-screen bg-white px-4 py-8 text-gray-900 pb-24 font-sans">
      <div className="mx-auto max-w-lg space-y-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="p-2 rounded-2xl bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 group">
              <svg className="transition-transform group-active:-translate-x-1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">마라톤</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEventFormOpen(true)}
              className="rounded-2xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
            >
              대회 등록
            </button>
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-3 py-2 text-xs font-bold text-gray-900 hover:bg-[#b8e600] active:scale-95 transition-all"
            >
              참가 신청
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
              activeTab === 'events'
                ? 'bg-[#CCFF00] text-gray-900 border border-[#b8e600]'
                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            대회 일정
          </button>
          <button
            onClick={() => setActiveTab('pbs')}
            className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
              activeTab === 'pbs'
                ? 'bg-[#CCFF00] text-gray-900 border border-[#b8e600]'
                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            최고기록
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
                activeTab === 'manage'
                  ? 'bg-gray-900 text-white border border-gray-900 shadow-sm'
                  : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              대회 관리 🛠️
            </button>
          )}
        </div>

        {/* 대회 일정 탭 */}
        {activeTab === 'events' && (
          <>
            {events.filter(e => e.is_active).length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">확정된 대회 일정</h2>
                {events.filter(e => e.is_active).map(event => {
                  const isPast = event.event_date < today
                  const eventParticipants = participants.filter(p => p.event_id === event.id || p.marathon_name === event.name)
                  return (
                    <div key={event.id} className={`rounded-2xl border border-gray-200 ${isPast ? 'bg-gray-50 opacity-60' : 'bg-white'} overflow-hidden shadow-sm`}>
                      <div className="px-4 py-3 flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{event.name}</h3>
                          <p className="text-xs text-amber-700 mt-0.5">일시: {event.event_date}{event.location && ` · 장소: ${event.location}`}</p>
                          {event.description && <p className="text-xs text-gray-500 mt-1">{event.description}</p>}
                          {event.registration_start && event.registration_end && (
                            <p className="text-xs text-blue-600 mt-0.5 font-semibold">접수: {event.registration_start} ~ {event.registration_end}</p>
                          )}
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {event.courses.map(c => (
                              <span key={c} className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600 font-bold">{c}</span>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2">
                            등록자: <span className="font-bold text-gray-500">{event.creator?.nickname || '알 수 없음'}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between min-h-[75px] shrink-0 ml-4">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">{eventParticipants.length}명</span>
                            {(event.created_by === userId || isAdmin) && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <button onClick={() => handleOpenEdit(event)} className="text-[10px] text-gray-500 hover:text-gray-900 font-bold">수정</button>
                                <span className="text-[10px] text-gray-300">|</span>
                                <button onClick={() => handleDeleteEvent(event.id)} className="text-[10px] text-gray-400 hover:text-red-600 font-bold">삭제</button>
                              </div>
                            )}
                          </div>
                          {!isPast && (
                            eventParticipants.some(p => p.user_id === userId) ? (
                              <span className="rounded-xl bg-gray-100 border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-400 select-none mt-2">
                                신청 완료 ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenRegisterForEvent(event.id)}
                                className="rounded-xl bg-[#CCFF00] border border-[#b8e600] px-3 py-1.5 text-xs font-bold text-gray-900 hover:bg-[#b8e600] active:scale-95 transition-all shadow-sm mt-2"
                              >
                                참가 신청 🏃
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      {eventParticipants.length > 0 && (
                        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3.5 space-y-3">
                          {(() => {
                            // 코스 순서대로 정렬 (예: 5K -> 10K -> Half -> Full)
                            const uniqueCourses = Array.from(new Set(eventParticipants.map(p => p.course)))
                              .sort((a, b) => {
                                const idxA = event.courses.indexOf(a)
                                const idxB = event.courses.indexOf(b)
                                if (idxA === -1) return 1
                                if (idxB === -1) return -1
                                return idxA - idxB
                              })

                            return uniqueCourses.map(course => {
                              const courseParts = eventParticipants.filter(p => p.course === course)
                              return (
                                <div key={course} className="space-y-1.5">
                                  {/* 부문 헤더 */}
                                  <div className="flex items-center gap-1.5 px-0.5">
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">{course}</span>
                                    <span className="text-[10px] font-bold text-gray-400">{courseParts.length}명</span>
                                  </div>
                                  {/* 부문 신청자 목록 */}
                                  <div className="flex flex-wrap gap-1.5">
                                    {courseParts.map(p => (
                                      <div key={p.id} className="flex items-center gap-1.5 rounded-xl bg-white border border-gray-150 px-2.5 py-1.5 shadow-sm">
                                        <span className="text-xs font-bold text-gray-800">{p.profiles.nickname}</span>
                                        {(p.user_id === userId || isAdmin) && (
                                          <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-650 transition-colors ml-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
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

        {/* 대회 관리 탭 (관리자 전용) */}
        {activeTab === 'manage' && isAdmin && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">전체 대회 관리 (총 {events.length}개)</h2>
            <div className="space-y-2.5">
              {events.map(event => (
                <div key={event.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        {event.name}
                        {!event.is_active && (
                          <span className="text-[10px] bg-red-50 text-red-500 border border-red-100 font-bold px-1.5 py-0.5 rounded">숨김</span>
                        )}
                      </h3>
                      <p className="text-xs text-amber-700 mt-0.5 font-semibold">일시: {event.event_date}</p>
                      {event.location && <p className="text-xs text-gray-500 mt-0.5">장소: {event.location}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">코스: {event.courses.join(', ')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(event)}
                        className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all active:scale-95"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-all active:scale-95"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center py-10 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-2xl">등록된 대회가 없습니다.</div>
              )}
            </div>
          </div>
        )}
    </div>

      {/* 참가 신청 모달 */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in duration-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">대회 참가 신청</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">대회 선택 *</label>
                {selectedEventId && events.some(e => e.id === selectedEventId) ? (
                  <div className="w-full rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-900 font-bold flex justify-between items-center">
                    <span className="truncate pr-2">{selectedEvent?.name}</span>
                    <button type="button" onClick={() => { setSelectedEventId(''); setSelectedCourse('') }} className="text-xs text-red-500 hover:text-red-650 font-bold shrink-0">변경</button>
                  </div>
                ) : (
                  <select
                    required
                    value={selectedEventId}
                    onChange={e => { setSelectedEventId(e.target.value); setSelectedCourse('') }}
                    className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                  >
                    <option value="">대회를 선택하세요</option>
                    {events.filter(ev => ev.event_date >= today).map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name} ({ev.event_date})</option>
                    ))}
                  </select>
                )}
              </div>
              {selectedEvent && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">참가 코스 *</label>
                  <select
                    required
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value)}
                    className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                  >
                    <option value="">코스 선택</option>
                    {Array.from(new Set([...selectedEvent.courses, '서포터즈'])).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsRegisterOpen(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all active:scale-[0.98]">취소</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-2xl bg-[#CCFF00] border border-[#b8e600] py-3 text-sm font-bold text-gray-900 disabled:opacity-50 active:scale-[0.98] transition-all">
                  {isSubmitting ? '등록 중...' : '신청'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 관리자: 대회 등록 모달 */}
      {isEventFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 my-4 shadow-xl animate-in fade-in duration-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">대회 일정 등록</h3>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">대회 이름 *</label>
                <input required type="text" value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="예) 서울마라톤" className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">대회 날짜 *</label>
                <input required type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">장소</label>
                <input type="text" value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} placeholder="예) 광화문 광장" className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">설명</label>
                <textarea value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} rows={2} placeholder="대회 안내 사항" className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none resize-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">코스 선택 *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {Array.from(new Set(['3km', '5km', '10km', '하프', '풀', '울트라', '서포터즈', ...newEventCourses])).map(course => {
                    const isSelected = newEventCourses.includes(course)
                    return (
                      <button
                        key={course}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewEventCourses(newEventCourses.filter(c => c !== course))
                          } else {
                            setNewEventCourses([...newEventCourses, course])
                          }
                        }}
                        className={`rounded-2xl px-3 py-1.5 text-xs font-bold border transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-[#CCFF00] text-gray-900 border-[#b8e600]'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {course}
                      </button>
                    )
                  })}
                </div>
                {/* 직접 입력 */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customCourseInput}
                    onChange={e => setCustomCourseInput(e.target.value)}
                    placeholder="직접 입력 (예: 15K, 50K)"
                    className="flex-1 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-400 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCourse}
                    className="rounded-xl bg-gray-900 text-white px-3.5 py-2 text-xs font-bold hover:bg-gray-800 active:scale-95 transition-all shrink-0"
                  >
                    추가
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">접수 시작일</label>
                  <input type="date" value={newEventRegStart} onChange={e => setNewEventRegStart(e.target.value)} className="w-full rounded-2xl bg-white border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">접수 종료일</label>
                  <input type="date" value={newEventRegEnd} onChange={e => setNewEventRegEnd(e.target.value)} className="w-full rounded-2xl bg-white border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsEventFormOpen(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all active:scale-[0.98]">취소</button>
                <button type="submit" disabled={isEventSubmitting} className="flex-1 rounded-2xl bg-[#CCFF00] border border-[#b8e600] py-3 text-sm font-bold text-gray-900 disabled:opacity-50 active:scale-[0.98] transition-all">
                  {isEventSubmitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 관리자: 대회 수정 모달 */}
      {editingEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 my-4 shadow-xl animate-in fade-in duration-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">대회 일정 수정</h3>
            <form onSubmit={handleUpdateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">대회 이름 *</label>
                <input required type="text" value={editEventName} onChange={e => setEditEventName(e.target.value)} placeholder="예) 서울마라톤" className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">대회 날짜 *</label>
                <input required type="date" value={editEventDate} onChange={e => setEditEventDate(e.target.value)} className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">장소</label>
                <input type="text" value={editEventLocation} onChange={e => setEditEventLocation(e.target.value)} placeholder="예) 광화문 광장" className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">설명</label>
                <textarea value={editEventDesc} onChange={e => setEditEventDesc(e.target.value)} rows={2} placeholder="대회 안내 사항" className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none resize-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">코스 선택 *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {Array.from(new Set(['3km', '5km', '10km', '하프', '풀', '울트라', '서포터즈', ...editEventCourses])).map(course => {
                    const isSelected = editEventCourses.includes(course)
                    return (
                      <button
                        key={course}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditEventCourses(editEventCourses.filter(c => c !== course))
                          } else {
                            setEditEventCourses([...editEventCourses, course])
                          }
                        }}
                        className={`rounded-2xl px-3 py-1.5 text-xs font-bold border transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-[#CCFF00] text-gray-900 border-[#b8e600]'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {course}
                      </button>
                    )
                  })}
                </div>
                {/* 직접 입력 */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customCourseInputEdit}
                    onChange={e => setCustomCourseInputEdit(e.target.value)}
                    placeholder="직접 입력 (예: 15K, 50K)"
                    className="flex-1 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-400 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCourseEdit}
                    className="rounded-xl bg-gray-900 text-white px-3.5 py-2 text-xs font-bold hover:bg-gray-800 active:scale-95 transition-all shrink-0"
                  >
                    추가
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">접수 시작일</label>
                  <input type="date" value={editEventRegStart} onChange={e => setEditEventRegStart(e.target.value)} className="w-full rounded-2xl bg-white border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">접수 종료일</label>
                  <input type="date" value={editEventRegEnd} onChange={e => setEditEventRegEnd(e.target.value)} className="w-full rounded-2xl bg-white border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 py-1">
                <input type="checkbox" id="editEventIsActive" checked={editEventIsActive} onChange={e => setEditEventIsActive(e.target.checked)} className="rounded text-gray-900 focus:ring-gray-900" />
                <label htmlFor="editEventIsActive" className="text-xs font-bold text-gray-600">이벤트 활성화 (체크 해제 시 숨김)</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingEventId(null)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all active:scale-[0.98]">취소</button>
                <button type="submit" disabled={isEventSubmitting} className="flex-1 rounded-2xl bg-[#CCFF00] border border-[#b8e600] py-3 text-sm font-bold text-gray-900 disabled:opacity-50 active:scale-[0.98] transition-all">
                  {isEventSubmitting ? '수정 중...' : '수정'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
