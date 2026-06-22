'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface SuggestionClientProps {
  userId: string
}

export default function SuggestionClient({ userId }: SuggestionClientProps) {
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setIsSubmitting(true)

    const { error } = await (supabase as any).from('suggestions').insert({
      user_id: isAnonymous ? null : userId,
      is_anonymous: isAnonymous,
      title,
      content,
    })

    if (error) {
      alert('등록 중 오류가 발생했습니다.')
      console.error(error)
      setIsSubmitting(false)
    } else {
      setIsSuccess(true)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 flex flex-col items-center justify-center text-center font-sans">
        <div className="text-5xl mb-4">💌</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">건의사항 전달 완료!</h2>
        <p className="text-xs text-gray-500 mb-8 leading-relaxed">소중한 의견 감사합니다.<br/>운영진이 꼼꼼히 확인하고 반영하겠습니다.</p>
        <Link href="/dashboard"
          className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-6 py-3.5 text-sm font-bold text-gray-900 hover:bg-[#b8e600] active:scale-95 transition-all">
          대시보드로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 text-gray-900 pb-24 font-sans">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <Link href="/dashboard" className="p-2 rounded-2xl bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">크루 건의함</h1>
            <p className="text-xs text-gray-500 mt-0.5">운영진에게 전하는 소중한 피드백</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 leading-relaxed">
          수원러닝크루 운영진에게 바라는 점, 새로운 아이디어, 불편했던 점 등을 자유롭게 남겨주세요.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">제목 *</label>
            <input 
              required 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="건의사항 제목을 적어주세요" 
              className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">내용 *</label>
            <textarea 
              required 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="자세한 내용을 적어주세요 (최대한 구체적으로 적어주시면 큰 도움이 됩니다)" 
              className="w-full h-40 rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 resize-none" 
            />
          </div>

          <label className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all active:scale-[0.99]">
            <input 
              type="checkbox" 
              checked={isAnonymous} 
              onChange={e => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-[#CCFF00] bg-white"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">익명으로 보내기</span>
              <span className="text-[10px] text-gray-500 mt-0.5">누가 보냈는지 운영진도 알 수 없습니다.</span>
            </div>
          </label>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full rounded-2xl bg-[#CCFF00] border border-[#b8e600] py-4 text-sm font-bold text-gray-900 disabled:opacity-50 hover:bg-[#b8e600] active:scale-[0.98] transition-all mt-2"
          >
            {isSubmitting ? '전송 중...' : '건의사항 보내기'}
          </button>
        </form>

      </div>
    </div>
  )
}
