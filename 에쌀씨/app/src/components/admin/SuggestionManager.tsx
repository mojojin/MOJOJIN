'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type SuggestionItem = Database['public']['Tables']['suggestions']['Row'] & {
  profiles?: { nickname: string } | null
}

export default function SuggestionManager() {
  const supabase = createClient() as any
  const [items, setItems] = useState<SuggestionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

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
      case 'PENDING': return { t: '확인 대기', c: 'bg-amber-50 border border-amber-200 text-amber-600' }
      case 'IN_PROGRESS': return { t: '진행 중', c: 'bg-blue-50 border border-blue-200 text-blue-600' }
      case 'RESOLVED': return { t: '완료', c: 'bg-emerald-50 border border-emerald-200 text-emerald-600' }
      default: return { t: s, c: 'bg-gray-50 border border-gray-200 text-gray-550' }
    }
  }

  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)
  const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div>
        <h2 className="text-base font-bold text-gray-900">건의함 관리</h2>
        <p className="text-[11px] text-gray-500">회원들이 남긴 소중한 의견을 확인하고 답변을 남겨주세요.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-400 text-xs">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200 text-gray-500 text-xs">등록된 건의사항이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {paginatedItems.map(item => {
            const st = getStatusLabel(item.status)
            const author = item.is_anonymous || !item.profiles ? '익명' : item.profiles.nickname
            const date = new Date(item.created_at).toLocaleDateString()

            return (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">{item.title}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">작성자: {author} • {date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${st.c}`}>{st.t}</span>
                </div>
                
                <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap py-1">
                  {item.content}
                </div>

                {/* 운영진 답변 영역 */}
                {item.admin_reply && (
                  <div className="mt-2 rounded-xl bg-gray-50 border border-gray-150 p-3">
                    <span className="text-[10px] font-bold text-gray-500 block mb-1">운영진 답변</span>
                    <div className="text-xs text-gray-600 whitespace-pre-wrap">
                      {item.admin_reply}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button onClick={() => openReply(item)} className="rounded-xl bg-white border border-gray-250 px-2.5 py-1 text-[10px] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-95">
                    답변/상태 변경
                  </button>
                </div>
              </div>
            )
          })}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                이전
              </button>
              <span className="text-xs text-gray-500 font-bold">
                {currentPage} / {totalPages} 페이지
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}

      {/* 답변 작성 모달 */}
      {replyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl animate-in fade-in duration-100">
            <h3 className="text-sm font-bold text-gray-950 mb-3">건의사항 처리</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">진행 상태</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5 text-xs text-gray-900 outline-none focus:border-gray-400">
                  <option value="PENDING">확인 대기</option>
                  <option value="IN_PROGRESS">진행 중</option>
                  <option value="RESOLVED">완료</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">답변 내용 (선택)</label>
                <textarea 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)} 
                  placeholder="작성자에게 전달할 답변을 입력하세요..."
                  className="w-full h-24 rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-400 resize-none" 
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setReplyId(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-all">취소</button>
                <button type="submit" className="flex-1 rounded-xl bg-[#CCFF00] border border-[#b8e600] py-2.5 text-xs font-bold text-gray-900 hover:bg-[#b8e600] active:scale-[0.98] transition-all">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
