'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type Location = Database['public']['Tables']['locations']['Row']

interface LocationManagerProps {
  initialLocations: Location[]
}

export default function LocationManager({ initialLocations }: LocationManagerProps) {
  const supabase = createClient() as any
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [newLocationName, setNewLocationName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 장소 추가
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocationName.trim()) return

    setActionInProgress('add')
    setError(null)
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({ name: newLocationName.trim() })
        .select('*')
        .single()

      if (error) throw error

      if (data) {
        setLocations((prev) => [data, ...prev])
        setNewLocationName('')
      }
    } catch (err) {
      console.error('Failed to add location:', err)
      setError('장소 추가 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  // 활성/비활성 상태 토글
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setActionInProgress(id)
    setError(null)
    try {
      const { error } = await supabase
        .from('locations')
        .update({ is_active: !currentActive })
        .eq('id', id)

      if (error) throw error

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === id ? { ...loc, is_active: !currentActive } : loc
        )
      )
    } catch (err) {
      console.error('Failed to toggle location state:', err)
      setError('장소 상태 변경 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  // 장소 삭제
  const handleDeleteLocation = async (id: string, name: string) => {
    if (!confirm(`정말 '${name}' 장소를 완전히 삭제하시겠습니까? 이 장소와 관련된 기존 기록의 장소 명칭은 보존되지만, 새로운 인증 시에는 이 장소를 선택할 수 없게 됩니다.`)) return

    setActionInProgress(id)
    setError(null)
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)

      if (error) throw error

      setLocations((prev) => prev.filter((loc) => loc.id !== id))
    } catch (err) {
      console.error('Failed to delete location:', err)
      setError('장소 삭제 중 오류가 발생했습니다. 기존 러닝 기록에서 참조 중인 장소인 경우 삭제할 수 없습니다. 대신 비활성화 처리를 권장합니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  // 장소 이름 수정 모드 돌입
  const startEditing = (id: string, name: string) => {
    setEditingId(id)
    setEditingName(name)
  }

  // 장소 이름 저장
  const handleSaveName = async (id: string) => {
    if (!editingName.trim()) return

    setActionInProgress(id)
    setError(null)
    try {
      const { error } = await supabase
        .from('locations')
        .update({ name: editingName.trim() })
        .eq('id', id)

      if (error) throw error

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === id ? { ...loc, name: editingName.trim() } : loc
        )
      )
      setEditingId(null)
    } catch (err) {
      console.error('Failed to save location name:', err)
      setError('장소 이름 수정 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. 새로운 장소 추가 */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-sm p-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
          📍 새로운 정기 벙 장소 등록
        </h2>
        <form onSubmit={handleAddLocation} className="flex gap-2">
          <input
            type="text"
            placeholder="장소 명칭 (예: 광교호수공원, 만석공원 등)"
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            disabled={actionInProgress === 'add'}
            className="
              flex-1 rounded-xl border border-white/10 bg-white/[0.03]
              px-4 py-3 text-xs text-white placeholder-gray-600
              focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20
              focus:outline-none transition-colors disabled:opacity-50
            "
          />
          <button
            type="submit"
            disabled={!newLocationName.trim() || actionInProgress === 'add'}
            className="
              rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50
              px-5 py-3 text-xs font-bold text-black
              transition-all duration-200 active:scale-[0.95]
              flex items-center gap-1.5
            "
          >
            {actionInProgress === 'add' ? (
              <svg className="animate-spin h-3.5 w-3.5 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
            장소 추가
          </button>
        </form>

        {error && (
          <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400 font-medium">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* 2. 장소 목록 */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            📍 등록된 장소 목록
          </h2>
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-bold text-gray-400">
            전체 {locations.length}개
          </span>
        </div>

        {locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-xl mb-2">📍</span>
            <p className="text-sm text-gray-500 font-medium">등록된 장소가 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {locations.map((loc) => {
              const isEditing = editingId === loc.id
              const isInProgress = actionInProgress === loc.id

              return (
                <div
                  key={loc.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group"
                >
                  <div className="flex-1 flex items-center gap-3 pr-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full max-w-sm">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="
                            flex-1 rounded-lg border border-white/10 bg-white/[0.03]
                            px-3 py-1.5 text-xs text-white
                            focus:border-emerald-500/40 focus:outline-none transition-colors
                          "
                        />
                        <button
                          onClick={() => handleSaveName(loc.id)}
                          disabled={!editingName.trim() || isInProgress}
                          className="
                            rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-bold text-black
                            transition-all duration-150 active:scale-[0.95] disabled:opacity-50
                          "
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          disabled={isInProgress}
                          className="
                            rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-gray-300
                            transition-all duration-150 active:scale-[0.95]
                          "
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">{loc.name}</span>
                        {loc.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            활성
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                            비활성
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      {/* 편집 */}
                      <button
                        onClick={() => startEditing(loc.id, loc.name)}
                        className="
                          rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/5 transition-all
                          opacity-0 group-hover:opacity-100 focus:opacity-100 duration-150
                        "
                        aria-label="장소 수정"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      {/* 활성 토글 */}
                      <button
                        onClick={() => handleToggleActive(loc.id, loc.is_active)}
                        disabled={isInProgress}
                        className={`
                          rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-all duration-200 active:scale-[0.95] disabled:opacity-50
                          ${
                            loc.is_active
                              ? 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }
                        `}
                      >
                        {loc.is_active ? '비활성화' : '활성화'}
                      </button>

                      {/* 장소 삭제 */}
                      <button
                        onClick={() => handleDeleteLocation(loc.id, loc.name)}
                        disabled={isInProgress}
                        className="
                          rounded-lg border border-transparent px-3 py-1.5 text-[10px] font-bold text-gray-500
                          hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20
                          transition-all duration-200 active:scale-[0.95] disabled:opacity-50
                        "
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
