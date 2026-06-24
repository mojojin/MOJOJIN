'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type InventoryItem = Database['public']['Tables']['inventory']['Row']

export default function InventoryManager() {
  const supabase = createClient() as any
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

  // 검색 및 페이지네이션 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

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
      case 'GOOD': return { t: '양호', c: 'bg-emerald-50 border border-emerald-200 text-emerald-600' }
      case 'FAIR': return { t: '보통', c: 'bg-amber-50 border border-amber-200 text-amber-600' }
      case 'POOR': return { t: '수리필요', c: 'bg-red-50 border border-red-200 text-red-650 font-bold' }
      case 'LOST': return { t: '분실', c: 'bg-gray-100 border border-gray-200 text-gray-500' }
      default: return { t: cond, c: 'bg-gray-100 border border-gray-200 text-gray-500' }
    }
  }

  // 검색 필터링
  const filteredItems = items.filter(item => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true
    return (
      item.item_name.toLowerCase().includes(term) ||
      (item.manager_name && item.manager_name.toLowerCase().includes(term)) ||
      (item.notes && item.notes.toLowerCase().includes(term))
    )
  })

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">비품 관리</h2>
          <p className="text-[11px] text-gray-500">크루 공용 자산을 관리합니다. (총 {filteredItems.length}개)</p>
        </div>
        <button onClick={() => openForm()} className="rounded-xl bg-[#CCFF00] border border-[#b8e600] px-3.5 py-1.5 text-xs font-bold text-gray-900 hover:bg-[#b8e600] active:scale-95 transition-all">
          물품 추가
        </button>
      </div>

      {/* 검색 바 */}
      <div className="relative">
        <input
          type="text"
          placeholder="물품명, 보관자, 메모로 검색..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full rounded-xl bg-white border border-gray-200 pl-9 pr-4 py-2 text-xs text-gray-900 outline-none focus:border-gray-400 h-9"
        />
        <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-400 text-xs">불러오는 중...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200 text-gray-500 text-xs">등록되었거나 검색 조건에 부합하는 비품이 없습니다.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paginatedItems.map(item => {
              const cond = getConditionLabel(item.condition)
              return (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-3 flex flex-col justify-between shadow-sm hover:border-gray-300 transition-all">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 break-all">{item.item_name}</h3>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${cond.c}`}>{cond.t}</span>
                    </div>
                    {item.notes && (
                      <p className="text-[10px] text-gray-500 break-all line-clamp-2 mt-1">
                        📝 {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    <div className="text-[10px] text-gray-600">
                      <span>수량: <strong className="text-gray-900 font-mono">{item.quantity}</strong>개</span>
                      <span className="mx-1.5 text-gray-300">·</span>
                      <span>보관: <strong className="text-gray-900">{item.manager_name || '없음'}</strong></span>
                    </div>

                    <div className="flex gap-1.5">
                      <button onClick={() => openForm(item)} className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-all active:scale-90" aria-label="수정">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-150 rounded-lg text-red-650 transition-all active:scale-90" aria-label="삭제">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 페이지네이션 컨트롤 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1.5 text-[11px] font-bold border border-gray-250 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-all active:scale-95"
              >
                이전
              </button>
              <span className="text-[11px] font-bold text-gray-500 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 text-[11px] font-bold border border-gray-250 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-all active:scale-95"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in duration-100">
            <h3 className="text-base font-bold text-gray-950 mb-4">{editId ? '비품 수정' : '새 비품 추가'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">물품명</label>
                <input required type="text" value={itemName} onChange={e => setItemName(e.target.value)} className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">수량</label>
                  <input required type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">상태</label>
                  <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400">
                    <option value="GOOD">양호</option>
                    <option value="FAIR">보통</option>
                    <option value="POOR">수리필요</option>
                    <option value="LOST">분실</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">보관/관리자 (선택)</label>
                <input type="text" value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="예: 회장님 트렁크" className="w-full rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">메모 (선택)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-20 rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:bg-gray-55 active:scale-[0.98] transition-all">취소</button>
                <button type="submit" className="flex-1 rounded-2xl bg-[#CCFF00] border border-[#b8e600] py-3 text-sm font-bold text-gray-900 hover:bg-[#b8e600] active:scale-[0.98] transition-all">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
