'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Notice = {
  id: string
  title: string
  content: string
  image_url: string | null
  link_url: string | null
}

/**
 * 앱 접속 시 공지 팝업 (계정 기준 1회 노출)
 * - 활성 + 기간 내 공지 중, 내가 "다시 보지 않기" 하지 않은 공지만 노출
 * - [닫기]: 이번 세션에서만 숨김 / [다시 보지 않기]: DB 기록 → 모든 기기에서 숨김
 */
export default function NoticePopup({ userId }: { userId: string }) {
  const [queue, setQueue] = useState<Notice[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const supabase = createClient() as any
      const nowIso = new Date().toISOString()
      const [{ data: notices }, { data: reads }] = await Promise.all([
        supabase
          .from('notices')
          .select('id,title,content,image_url,link_url,starts_at,ends_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase.from('notice_reads').select('notice_id').eq('user_id', userId),
      ])
      if (!alive || !notices) return
      const readIds = new Set((reads || []).map((r: any) => r.notice_id))
      const sessionClosed: string[] = JSON.parse(sessionStorage.getItem('src_notice_closed') || '[]')
      const pending = notices.filter(
        (n: any) =>
          !readIds.has(n.id) &&
          !sessionClosed.includes(n.id) &&
          (!n.starts_at || n.starts_at <= nowIso) &&
          (!n.ends_at || n.ends_at >= nowIso)
      )
      setQueue(pending)
      if (pending.length) requestAnimationFrame(() => setVisible(true))
    }
    load().catch(() => {})
    return () => { alive = false }
  }, [userId])

  const current = queue[0]
  if (!current) return null

  const next = () => {
    setVisible(false)
    setTimeout(() => {
      setQueue((q) => q.slice(1))
      if (queue.length > 1) requestAnimationFrame(() => setVisible(true))
    }, 250)
  }

  const handleClose = () => {
    const closed: string[] = JSON.parse(sessionStorage.getItem('src_notice_closed') || '[]')
    sessionStorage.setItem('src_notice_closed', JSON.stringify([...closed, current.id]))
    next()
  }

  const handleDismissForever = async () => {
    const supabase = createClient() as any
    await supabase.from('notice_reads').upsert({ notice_id: current.id, user_id: userId })
    next()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out pb-[env(safe-area-inset-bottom)] ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0'
        }`}
      >
        <div className="sm:hidden flex justify-center pt-2.5">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {current.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.image_url} alt="" className="w-full max-h-[45vh] object-cover mt-2 sm:mt-0" />
        )}

        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black tracking-wider bg-[#CCFF00] text-gray-900 px-2 py-0.5 rounded-md">NOTICE</span>
            {queue.length > 1 && <span className="text-[10px] text-gray-400 font-bold">1 / {queue.length}</span>}
          </div>
          <h2 className="text-lg font-extrabold text-gray-950 leading-snug break-keep">{current.title}</h2>
          {current.content && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line break-keep max-h-[30vh] overflow-y-auto">
              {current.content}
            </p>
          )}
          {current.link_url && (
            <a
              href={current.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center w-full py-3 rounded-2xl bg-gray-950 text-white text-sm font-bold active:scale-[0.98] transition"
            >
              자세히 보기 →
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 border-t border-gray-100">
          <button onClick={handleDismissForever} className="py-4 text-sm font-semibold text-gray-400 active:bg-gray-50">
            다시 보지 않기
          </button>
          <button onClick={handleClose} className="py-4 text-sm font-extrabold text-gray-950 border-l border-gray-100 active:bg-gray-50">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
