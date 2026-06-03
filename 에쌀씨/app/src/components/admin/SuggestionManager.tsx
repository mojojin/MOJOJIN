'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type SuggestionItem = Database['public']['Tables']['suggestions']['Row'] & {
  profiles?: { nickname: string } | null
}

export default function SuggestionManager() {
  const supabase = createClient()
  const [items, setItems] = useState<SuggestionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 답변 폼
  const [replyId, setReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [status, setStatus] = useState('PENDING')

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('suggestions')
      .select('*, profiles(nickname)')
      .order('created_at', { ascending: false })
    
    if (data) setItems(data as unknown as SuggestionItem[])
    setIsLoading(false)
  }

  const openReply = (item: SuggestionItem) => {
    setReplyId(item.id)
    setReplyText(item.admin_reply || '')
    setStatus(item.status)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyId) return

    await supabase.from('suggestions').update({
      admin_reply: replyText,
      status: status
    }).eq('id', replyId)
    
    setReplyId(null)
    fetchItems()
  }

  const getStatusLabel = (s: string) => {
    switch(s) {
      case 'PENDING': return { t: '확인 대기', c: 'bg-amber-500/20 text-amber-400' }
      case 'IN_PROGRESS': return { t: '검토/진행 중', c: 'bg-blue-500/20 text-blue-400' }
      case 'RESOLVED': return { t: '답변/반영 완료', c: 'bg-emerald-500/20 text-emerald-400' }
      default: return { t: s, c: 'bg-gray-500/20 text-gray-400' }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">💡 건의함 관리</h2>
        <p className="text-xs text-gray-400">회원들이 남긴 소중한 의견을 확인하고 답변을 남겨주세요.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/5 text-gray-400">등록된 건의사항이 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const st = getStatusLabel(item.status)
            const author = item.is_anonymous || !item.profiles ? '익명 👻' : item.profiles.nickname
            const date = new Date(item.created_at).toLocaleDateString()

            return (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-gray-900/50 p-5 space-y-3">
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">작성자: {author} • {date}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${st.c}`}>{st.t}</span>
                </div>
                
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap py-2">
                  {item.content}
                </div>

                {/* 운영진 답변 영역 */}
                {item.admin_reply && (
                  <div className="mt-3 rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💬</span>
                      <span className="text-xs font-bold text-purple-400">운영진 답변</span>
                    </div>
                    <div className="text-sm text-purple-200/90 whitespace-pre-wrap">
                      {item.admin_reply}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button onClick={() => openReply(item)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-white/10">
                    상태 변경 / 답변 남기기
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 답변 작성 모달 */}
      {replyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-900 p-6">
            <h3 className="text-lg font-bold text-white mb-4">건의사항 처리</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">진행 상태</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50">
                  <option value="PENDING">확인 대기</option>
                  <option value="IN_PROGRESS">검토/진행 중</option>
                  <option value="RESOLVED">답변/반영 완료</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">답변 내용 (선택)</label>
                <textarea 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)} 
                  placeholder="작성자에게 전달할 답변을 입력하세요..."
                  className="w-full h-32 rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 resize-none" 
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setReplyId(null)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-gray-400">취소</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-500 py-3 text-sm font-bold text-black hover:bg-purple-400">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
