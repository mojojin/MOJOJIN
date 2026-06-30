'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ScheduleManagerProps {
  userId: string
  locations?: any[]
}

export default function ScheduleManager({ userId }: ScheduleManagerProps) {
  const supabase = createClient() as any
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCalendarImage()
  }, [])

  const fetchCalendarImage = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', 'calendar_image_url')
        .single()

      if (data) {
        setImageUrl(data.setting_value)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return alert('이미지 파일을 선택해 주세요.')

    setIsSubmitting(true)
    try {
      const fileExt = file.name.split('.').pop()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileName = `calendar_${Date.now()}_${randomId}.${fileExt}`
      const filePath = `calendar/${fileName}`

      // 1. Storage 업로드
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. 공용 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      // 3. system_settings에 upsert
      const { error: dbError } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'calendar_image_url',
          setting_value: publicUrl,
          updated_at: new Date().toISOString()
        })

      if (dbError) throw dbError

      alert('일정표 이미지가 성공적으로 업로드되었습니다!')
      setImageUrl(publicUrl)
      setFile(null)
      setPreviewUrl(null)
    } catch (err: any) {
      console.error(err)
      alert('업로드 실패: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 등록된 일정표 이미지를 삭제하시겠습니까?')) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('setting_key', 'calendar_image_url')

      if (error) throw error

      alert('삭제 완료되었습니다.')
      setImageUrl(null)
      setFile(null)
      setPreviewUrl(null)
    } catch (err: any) {
      console.error(err)
      alert('삭제 실패: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-950 mb-1">일정표 이미지 등록</h3>
        <p className="text-xs text-gray-500 mb-4">매번 텍스트 일정을 하나씩 쓰지 않고, 월간 전체 일정이 나와있는 포스터/이미지를 업로드하여 표시합니다.</p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-gray-400 transition-colors relative bg-gray-50/50">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {previewUrl ? (
              <div className="space-y-2">
                <img src={previewUrl} alt="Preview" className="max-h-60 mx-auto rounded-xl shadow-sm object-contain" />
                <p className="text-xs text-gray-500 font-medium">{file?.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-3xl block">🖼️</span>
                <span className="text-xs font-bold text-gray-700 block">클릭하거나 이미지를 드래그하여 업로드</span>
                <span className="text-[10px] text-gray-400 block">지원 형식: JPG, PNG, WEBP (최대 10MB)</span>
              </div>
            )}
          </div>

          {previewUrl && (
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => { setFile(null); setPreviewUrl(null) }} 
                className="flex-1 py-3 border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] text-xs text-center animate-in fade-in"
              >
                취소
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#CCFF00] border border-[#b8e600] text-gray-900 font-bold rounded-2xl hover:bg-[#b8e600] transition-all active:scale-[0.98] text-xs disabled:opacity-50 animate-in fade-in"
              >
                {isSubmitting ? '업로드 중...' : '이미지 저장하기'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 현재 등록된 일정표 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-950">현재 등록된 일정표</h3>
          {imageUrl && (
            <button 
              onClick={handleDelete} 
              disabled={isSubmitting}
              className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              이미지 삭제
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs text-gray-400">불러오는 중...</div>
        ) : imageUrl ? (
          <div className="rounded-xl overflow-hidden border border-gray-150 bg-gray-50 p-2">
            <img src={imageUrl} alt="Current Calendar" className="w-full max-h-[450px] object-contain rounded-lg shadow-sm" />
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl">
            등록된 일정표 이미지가 없습니다. 이미지를 등록해 주세요.
          </div>
        )}
      </div>
    </div>
  )
}
