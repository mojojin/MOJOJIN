'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface MarathonClientProps {
  userId: string
}

interface MarathonParticipant {
  id: string
  user_id: string
  marathon_name: string
  marathon_date: string
  course: string
  profiles: {
    nickname: string
  }
}

export default function MarathonClient({ userId }: MarathonClientProps) {
  const supabase = createClient()
  const [participants, setParticipants] = useState<MarathonParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 폼 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [marathonName, setMarathonName] = useState('')
  const [marathonDate, setMarathonDate] = useState('')
  const [course, setCourse] = useState('10K')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchParticipants()
  }, [])

  const fetchParticipants = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('marathon_participants')
      .select('*, profiles(nickname)')
      .order('marathon_date', { ascending: true })
    
    if (data) {
      // 대회별로 묶거나 просто 리스트로 보여주기
      setParticipants(data as unknown as MarathonParticipant[])
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!marathonName || !marathonDate || !course) return
    setIsSubmitting(true)

    const { error } = await (supabase as any).from('marathon_participants').insert({
      user_id: userId,
      marathon_name: marathonName,
      marathon_date: marathonDate,
      course: course
    })

    if (error) {
      alert('등록 중 오류가 발생했습니다.')
    } else {
      setIsFormOpen(false)
      setMarathonName('')
      setMarathonDate('')
      setCourse('10K')
      fetchParticipants()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('참가 명단에서 삭제하시겠습니까?')) return
    const { error } = await supabase.from('marathon_participants').delete().eq('id', id)
    if (!error) fetchParticipants()
  }

  // Group by marathon name and date
  const grouped = participants.reduce((acc, curr) => {
    const key = `${curr.marathon_name}|${curr.marathon_date}`
    if (!acc[key]) acc[key] = []
    acc[key].push(curr)
    return acc
  }, {} as Record<string, MarathonParticipant[]>)

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 text-gray-200 pb-24">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <h1 className="text-xl font-bold text-white">🏅 마라톤 대회 명단</h1>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-sm font-bold text-amber-400">
            + 내 참가 등록
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">불러오는 중...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white/5 rounded-2xl border border-white/5">등록된 참가 명단이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([key, group]) => {
              const [name, date] = key.split('|')
              return (
                <div key={key} className="rounded-2xl border border-white/10 bg-gray-900/50 overflow-hidden">
                  <div className="bg-amber-500/10 border-b border-white/5 px-4 py-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-white">{name}</h3>
                      <p className="text-xs text-amber-400 mt-0.5">🗓 {date}</p>
                    </div>
                    <div className="text-xs font-bold text-gray-400 bg-black/40 px-2 py-1 rounded-lg">
                      총 {group.length}명
                    </div>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {group.map(p => (
                      <div key={p.id} className="relative group rounded-xl bg-white/5 border border-white/10 px-3 py-2 flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-200">{p.profiles.nickname}</span>
                        <span className="text-xs text-gray-500 font-mono bg-black/50 px-1.5 py-0.5 rounded">{p.course}</span>
                        {p.user_id === userId && (
                          <button onClick={() => handleDelete(p.id)} className="ml-1 text-red-400 hover:text-red-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gray-900 p-6">
            <h3 className="text-lg font-bold text-white mb-4">🏅 마라톤 참가 등록</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">대회 이름</label>
                <input required type="text" value={marathonName} onChange={e => setMarathonName(e.target.value)} placeholder="예) 서울국제마라톤" className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">대회 날짜</label>
                <input required type="date" value={marathonDate} onChange={e => setMarathonDate(e.target.value)} className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50 [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">참가 코스</label>
                <select value={course} onChange={e => setCourse(e.target.value)} className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50">
                  <option value="10K">10K</option>
                  <option value="Half">Half</option>
                  <option value="Full">Full</option>
                  <option value="5K">5K</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-gray-400">취소</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-black disabled:opacity-50">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
