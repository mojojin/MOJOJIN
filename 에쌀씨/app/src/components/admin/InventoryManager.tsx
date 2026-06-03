'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type InventoryItem = Database['public']['Tables']['inventory']['Row']

export default function InventoryManager() {
  const supabase = createClient()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 폼 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [condition, setCondition] = useState('GOOD')
  const [managerName, setManagerName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('inventory').select('*').order('item_name')
    if (data) setItems(data)
    setIsLoading(false)
  }

  const openForm = (item?: InventoryItem) => {
    if (item) {
      setEditId(item.id)
      setItemName(item.item_name)
      setQuantity(item.quantity)
      setCondition(item.condition)
      setManagerName(item.manager_name || '')
      setNotes(item.notes || '')
    } else {
      setEditId(null)
      setItemName('')
      setQuantity(1)
      setCondition('GOOD')
      setManagerName('')
      setNotes('')
    }
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      item_name: itemName,
      quantity,
      condition,
      manager_name: managerName || null,
      notes: notes || null
    }

    if (editId) {
      await supabase.from('inventory').update(payload).eq('id', editId)
    } else {
      await supabase.from('inventory').insert(payload)
    }
    setIsFormOpen(false)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 비품을 삭제하시겠습니까?')) return
    await supabase.from('inventory').delete().eq('id', id)
    fetchItems()
  }

  const getConditionLabel = (cond: string) => {
    switch(cond) {
      case 'GOOD': return { t: '양호', c: 'bg-emerald-500/20 text-emerald-400' }
      case 'FAIR': return { t: '보통', c: 'bg-amber-500/20 text-amber-400' }
      case 'POOR': return { t: '수리필요', c: 'bg-red-500/20 text-red-400' }
      case 'LOST': return { t: '분실', c: 'bg-gray-500/20 text-gray-400' }
      default: return { t: cond, c: 'bg-gray-500/20 text-gray-400' }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">📦 공용품(비품) 관리</h2>
          <p className="text-xs text-gray-400">크루 공용 자산을 관리합니다.</p>
        </div>
        <button onClick={() => openForm()} className="rounded-xl bg-indigo-500/20 border border-indigo-500/40 px-3 py-2 text-sm font-bold text-indigo-400 hover:bg-indigo-500/30">
          + 물품 추가
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/5 text-gray-400">등록된 비품이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map(item => {
            const cond = getConditionLabel(item.condition)
            return (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-gray-900/50 p-4 relative group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-bold text-white">{item.item_name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cond.c}`}>{cond.t}</span>
                </div>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>수량: <span className="text-white font-mono">{item.quantity}</span>개</p>
                  <p>보관/관리자: {item.manager_name ? <span className="text-indigo-400 font-bold">{item.manager_name}</span> : '-'}</p>
                  {item.notes && <p className="text-xs text-gray-500 mt-2 bg-black/40 p-2 rounded-lg">{item.notes}</p>}
                </div>

                <div className="absolute top-4 right-16 hidden group-hover:flex gap-2">
                  <button onClick={() => openForm(item)} className="text-gray-400 hover:text-white">✏️</button>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-400">🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gray-900 p-6">
            <h3 className="text-lg font-bold text-white mb-4">{editId ? '비품 수정' : '새 비품 추가'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">물품명</label>
                <input required type="text" value={itemName} onChange={e => setItemName(e.target.value)} className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">수량</label>
                  <input required type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">상태</label>
                  <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50">
                    <option value="GOOD">양호</option>
                    <option value="FAIR">보통</option>
                    <option value="POOR">수리필요</option>
                    <option value="LOST">분실</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">보관/관리자 (선택)</label>
                <input type="text" value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="예: 회장님 트렁크" className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">메모 (선택)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-20 rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-gray-400">취소</button>
                <button type="submit" className="flex-1 rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
