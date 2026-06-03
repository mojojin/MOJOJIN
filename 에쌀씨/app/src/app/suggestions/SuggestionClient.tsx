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

    const { error } = await supabase.from('suggestions').insert({
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
      <div className="min-h-screen bg-gray-950 px-4 py-8 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">💌</div>
        <h2 className="text-2xl font-black text-white mb-2">건의사항 전달 완료!</h2>
        <p className="text-sm text-gray-400 mb-8">소중한 의견 감사합니다.<br/>운영진이 꼼꼼히 확인하고 반영하겠습니다.</p>
        <Link href="/dashboard" className="rounded-xl bg-purple-500 px-6 py-3 text-sm font-bold text-black hover:bg-purple-400">
          대시보드로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 text-gray-200 pb-24">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-xl font-bold text-white">💡 크루 건의함</h1>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 text-sm text-purple-200/80 leading-relaxed">
          수원러닝크루 운영진에게 바라는 점, 새로운 아이디어, 불편했던 점 등을 자유롭게 남겨주세요.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">제목</label>
            <input 
              required 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="건의사항 제목을 적어주세요" 
              className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50" 
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">내용</label>
            <textarea 
              required 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="자세한 내용을 적어주세요 (최대한 구체적으로 적어주시면 큰 도움이 됩니다)" 
              className="w-full h-40 rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 resize-none" 
            />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <input 
              type="checkbox" 
              checked={isAnonymous} 
              onChange={e => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500/50 bg-black"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">익명으로 보내기 👻</span>
              <span className="text-xs text-gray-500">누가 보냈는지 운영진도 알 수 없습니다.</span>
            </div>
          </label>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full rounded-2xl bg-purple-500 py-4 text-[15px] font-extrabold text-black disabled:opacity-50 hover:bg-purple-400 transition-colors mt-2"
          >
            {isSubmitting ? '전송 중...' : '건의사항 보내기'}
          </button>
        </form>

      </div>
    </div>
  )
}
