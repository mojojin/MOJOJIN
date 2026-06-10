'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface GpxCourse {
  id: string
  course_name: string
  description: string | null
  distance_km: number | null
  file_url: string
  file_name: string
  created_at: string
}

interface GpxClientProps {
  userId: string
  isAdmin: boolean
  initialGpxCourses: GpxCourse[]
}

export default function GpxClient({ userId, isAdmin, initialGpxCourses }: GpxClientProps) {
  const supabase = createClient()
  const [gpxCourses, setGpxCourses] = useState<GpxCourse[]>(initialGpxCourses)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [description, setDescription] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !courseName) return
    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${courseName.replace(/\s+/g, '_')}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('gpx-files').upload(fileName, file, { contentType: 'application/gpx+xml' })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('gpx-files').getPublicUrl(fileName)
      await (supabase as any).from('gpx_courses').insert({
        course_name: courseName,
        description: description || null,
        distance_km: distanceKm ? parseFloat(distanceKm) : null,
        file_url: urlData.publicUrl,
        file_name: file.name,
        uploaded_by: userId,
      })
      const { data: newList } = await (supabase as any)
        .from('gpx_courses').select('*').order('created_at', { ascending: false })
      setGpxCourses(newList || [])
      setIsFormOpen(false)
      setCourseName(''); setDescription(''); setDistanceKm(''); setFile(null)
    } catch (err: any) {
      alert('업로드 오류: ' + err?.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await (supabase as any).from('gpx_courses').delete().eq('id', id)
    setGpxCourses(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 text-gray-200 pb-24">
      <div className="mx-auto max-w-lg space-y-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">🗺️ GPX 코스 라운지</h1>
              <p className="text-xs text-gray-500 mt-0.5">코스 파일을 다운받아 달려보세요!</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setIsFormOpen(true)}
              className="rounded-xl bg-teal-500/20 border border-teal-500/30 px-3 py-2 text-xs font-bold text-teal-400 hover:bg-teal-500/30 transition-all">
              + 코스 추가
            </button>
          )}
        </div>

        {/* 안내 배너 */}
        <div className="rounded-2xl bg-teal-900/20 border border-teal-500/20 p-4 flex items-start gap-3">
          <div className="text-2xl">📍</div>
          <div>
            <p className="text-xs font-bold text-teal-400">GPX 파일 사용 방법</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              파일을 다운로드한 후 <span className="text-white font-bold">가민 커넥트, 스트라바, 나이키런</span> 등의 앱에 불러오면 코스를 따라 달릴 수 있습니다.
            </p>
          </div>
        </div>

        {/* 코스 목록 */}
        {gpxCourses.length === 0 ? (
          <div className="text-center py-16 text-gray-600 text-sm">
            <div className="text-5xl mb-3">🗺️</div>
            <p>등록된 코스가 없습니다.</p>
            {isAdmin && <p className="text-xs mt-1">코스 추가 버튼으로 GPX 파일을 등록하세요.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {gpxCourses.map(course => (
              <div key={course.id} className="rounded-2xl border border-white/10 bg-gray-900/50 p-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15 text-3xl flex-shrink-0">🗺️</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{course.course_name}</p>
                  {course.distance_km && (
                    <p className="text-xs text-teal-400 mt-0.5 font-bold">{course.distance_km}km</p>
                  )}
                  {course.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{course.description}</p>
                  )}
                  <p className="text-[10px] text-gray-700 mt-1">{course.created_at.split('T')[0]} 등록</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <a href={course.file_url} download={course.file_name} target="_blank" rel="noreferrer"
                    className="rounded-xl bg-teal-500 px-3 py-2 text-xs font-bold text-white hover:bg-teal-400 transition-all text-center flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    GPX
                  </a>
                  {isAdmin && (
                    <button onClick={() => handleDelete(course.id)}
                      className="rounded-xl border border-red-500/20 py-1.5 text-[10px] text-red-400 hover:bg-red-500/10 transition-all text-center">
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 업로드 모달 */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gray-900 p-6">
            <h3 className="text-lg font-bold text-white mb-4">🗺️ GPX 코스 등록</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">코스 이름 *</label>
                <input required type="text" value={courseName} onChange={e => setCourseName(e.target.value)}
                  placeholder="예) 인계동 10K 코스"
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-teal-500/50" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">거리 (km)</label>
                <input type="number" step="0.1" value={distanceKm} onChange={e => setDistanceKm(e.target.value)}
                  placeholder="예) 10.5"
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">설명</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  placeholder="코스 간단 설명"
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">GPX 파일 *</label>
                <input required type="file" accept=".gpx"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-gray-400">취소</button>
                <button type="submit" disabled={isUploading}
                  className="flex-1 rounded-xl bg-teal-500 py-3 text-sm font-bold text-white disabled:opacity-50">
                  {isUploading ? '업로드 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
