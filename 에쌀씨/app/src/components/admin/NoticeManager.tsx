'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type NoticeRow = {
  id: string
  title: string
  content: string
  image_url: string | null
  link_url: string | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

const emptyForm = { title: '', content: '', image_url: '', link_url: '', starts_at: '', ends_at: '' }

export default function NoticeManager({ userId, totalMembers }: { userId: string; totalMembers: number }) {
  const supabase = createClient() as any
  const [items, setItems] = useState<NoticeRow[]>([])
  const [readCounts, setReadCounts] = useState<Record<string, number>>({})
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)

  const fetchItems = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false })
    if (error) {
      setTableMissing(true)
      setIsLoading(false)
      return
    }
    setItems(data || [])
    const { data: reads } = await supabase.from('notice_reads').select('notice_id')
    const counts: Record<string, number> = {}
    ;(reads || []).forEach((r: any) => { counts[r.notice_id] = (counts[r.notice_id] || 0) + 1 })
    setReadCounts(counts)
    setIsLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const toIso = (v: string) => (v ? new Date(v).toISOString() : null)
  const toLocal = (v: string | null) => {
    if (!v) return ''
    const d = new Date(v)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return alert('제목을 입력해주세요.')
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      image_url: form.image_url.trim() || null,
      link_url: form.link_url.trim() || null,
      starts_at: toIso(form.starts_at),
      ends_at: toIso(form.ends_at),
    }
    const { error } = editingId
      ? await supabase.from('notices').update(payload).eq('id', editingId)
      : await supabase.from('notices').insert({ ...payload, created_by: userId, is_active: true })
    if (error) return alert('저장 실패: ' + error.message)
    setForm(emptyForm)
    setEditingId(null)
    fetchItems()
  }

  const startEdit = (n: NoticeRow) => {
    setEditingId(n.id)
    setForm({
      title: n.title,
      content: n.content,
      image_url: n.image_url || '',
      link_url: n.link_url || '',
      starts_at: toLocal(n.starts_at),
      ends_at: toLocal(n.ends_at),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleActive = async (n: NoticeRow) => {
    await supabase.from('notices').update({ is_active: !n.is_active }).eq('id', n.id)
    fetchItems()
  }

  const remove = async (n: NoticeRow) => {
    if (!confirm(`'${n.title}' 공지를 삭제할까요?`)) return
    await supabase.from('notices').delete().eq('id', n.id)
    fetchItems()
  }

  const statusOf = (n: NoticeRow) => {
    const now = new Date().toISOString()
    if (!n.is_active) return { label: '꺼짐', cls: 'bg-gray-100 text-gray-500' }
    if (n.starts_at && n.starts_at > now) return { label: '예약', cls: 'bg-blue-50 text-blue-600' }
    if (n.ends_at && n.ends_at < now) return { label: '종료', cls: 'bg-gray-100 text-gray-500' }
    return { label: '노출 중', cls: 'bg-[#CCFF00] text-gray-900' }
  }

  const input = 'w-full bg-white border border-gray-200 rounded-2xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 placeholder-gray-400'

  if (tableMissing) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        공지 테이블이 아직 없습니다. Supabase SQL Editor에서 <code className="font-mono">supabase/notices.sql</code>을 먼저 실행해주세요.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-950">📢 {editingId ? '공지 수정' : '새 공지 팝업'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">회원이 앱 접속 시 1회 팝업으로 노출됩니다. (다시 보지 않기 누르면 모든 기기에서 숨김)</p>
          </div>
        </div>
        <input className={input} placeholder="제목 *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <textarea className={`${input} h-28 resize-none`} placeholder="내용" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={input} placeholder="이미지 URL (선택)" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
          <input className={input} placeholder="자세히 보기 링크 (선택)" value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="block text-[11px] font-bold text-gray-500">시작 (비우면 즉시)</span>
            <input type="datetime-local" className={input} value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] font-bold text-gray-500">종료 (비우면 계속)</span>
            <input type="datetime-local" className={input} value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }} className="px-4 py-2 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-500">
              취소
            </button>
          )}
          <button type="submit" className="px-5 py-2 rounded-2xl bg-[#CCFF00] border border-[#b8e600] text-gray-900 text-xs font-bold active:scale-95">
            {editingId ? '수정 저장' : '공지 등록'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 px-1">등록된 공지 ({items.length})</h4>
        {isLoading && <p className="text-xs text-gray-400 px-1">불러오는 중...</p>}
        {!isLoading && items.length === 0 && <p className="text-xs text-gray-400 px-1">등록된 공지가 없습니다.</p>}
        {items.map(n => {
          const s = statusOf(n)
          return (
            <div key={n.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${s.cls}`}>{s.label}</span>
                    <span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-gray-950 truncate">{n.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    확인 {readCounts[n.id] || 0} / {totalMembers}명
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => toggleActive(n)} className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-600">
                    {n.is_active ? '끄기' : '켜기'}
                  </button>
                  <button onClick={() => startEdit(n)} className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-600">수정</button>
                  <button onClick={() => remove(n)} className="px-2.5 py-1.5 rounded-xl border border-red-100 text-[11px] font-bold text-red-500">삭제</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
