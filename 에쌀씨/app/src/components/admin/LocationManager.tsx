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
  
  // 새 장소 추가용 상태
  const [newLocationName, setNewLocationName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newParkingInfo, setNewParkingInfo] = useState('')
  const [newMapUrl, setNewMapUrl] = useState('')
  
  // 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingAddress, setEditingAddress] = useState('')
  const [editingParkingInfo, setEditingParkingInfo] = useState('')
  const [editingMapUrl, setEditingMapUrl] = useState('')
  
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
        .insert({ 
          name: newLocationName.trim(),
          address: newAddress.trim() || null,
          parking_info: newParkingInfo.trim() || null,
          map_url: newMapUrl.trim() || null
        })
        .select('*')
        .single()

      if (error) throw error

      if (data) {
        setLocations((prev) => [data, ...prev])
        setNewLocationName('')
        setNewAddress('')
        setNewParkingInfo('')
        setNewMapUrl('')
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
    if (!confirm(`정말 '${name}' 장소를 완전히 삭제하시겠습니까? 관련된 기록이 있다면 삭제할 수 없습니다.`)) return

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
      setError('장소 삭제 중 오류가 발생했습니다. 기록에서 사용 중인 경우 삭제 대신 비활성화를 이용하세요.')
    } finally {
      setActionInProgress(null)
    }
  }

  // 장소 수정 모드 돌입
  const startEditing = (loc: Location) => {
    setEditingId(loc.id)
    setEditingName(loc.name)
    setEditingAddress(loc.address || '')
    setEditingParkingInfo(loc.parking_info || '')
    setEditingMapUrl(loc.map_url || '')
  }

  // 장소 정보 저장
  const handleSaveLocation = async (id: string) => {
    if (!editingName.trim()) return

    setActionInProgress(id)
    setError(null)
    try {
      const { error } = await supabase
        .from('locations')
        .update({ 
          name: editingName.trim(),
          address: editingAddress.trim() || null,
          parking_info: editingParkingInfo.trim() || null,
          map_url: editingMapUrl.trim() || null
        })
        .eq('id', id)

      if (error) throw error

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === id ? { 
            ...loc, 
            name: editingName.trim(),
            address: editingAddress.trim() || null,
            parking_info: editingParkingInfo.trim() || null,
            map_url: editingMapUrl.trim() || null
          } : loc
        )
      )
      setEditingId(null)
    } catch (err) {
      console.error('Failed to save location info:', err)
      setError('장소 정보 수정 중 오류가 발생했습니다.')
    } finally {
      setActionInProgress(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. 새로운 장소 추가 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
          📍 새로운 정기 벙 장소 등록
        </h2>
        <form onSubmit={handleAddLocation} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="장소 명칭 (예: 광교호수공원) *"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              disabled={actionInProgress === 'add'}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-900 placeholder-gray-450 focus:border-gray-400 focus:outline-none transition-colors"
              required
            />
            <input
              type="text"
              placeholder="주소 (예: 경기 수원시 영통구 광교호수로 165)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              disabled={actionInProgress === 'add'}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-900 placeholder-gray-450 focus:border-gray-400 focus:outline-none transition-colors"
            />
            <input
              type="text"
              placeholder="주차 정보 (예: 공영주차장 3시간 무료)"
              value={newParkingInfo}
              onChange={(e) => setNewParkingInfo(e.target.value)}
              disabled={actionInProgress === 'add'}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-900 placeholder-gray-450 focus:border-gray-400 focus:outline-none transition-colors"
            />
            <input
              type="url"
              placeholder="카카오맵 URL (예: https://kko.to/...)"
              value={newMapUrl}
              onChange={(e) => setNewMapUrl(e.target.value)}
              disabled={actionInProgress === 'add'}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-900 placeholder-gray-450 focus:border-gray-400 focus:outline-none transition-colors"
            />
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!newLocationName.trim() || actionInProgress === 'add'}
              className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-6 py-3 text-xs font-bold text-gray-900 transition-all duration-200 active:scale-[0.95] flex items-center gap-1.5"
            >
              장소 추가하기
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 font-semibold">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* 2. 장소 목록 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            📍 등록된 장소 목록
          </h2>
          <span className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-500">
            전체 {locations.length}개
          </span>
        </div>

        {locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 text-xs">
            <p>등록된 장소가 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-155">
            {locations.map((loc) => {
              const isEditing = editingId === loc.id
              const isInProgress = actionInProgress === loc.id

              return (
                <div key={loc.id} className="py-5 first:pt-0 last:pb-0 group">
                  {isEditing ? (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          placeholder="장소 명칭 *"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-gray-450 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editingAddress}
                          onChange={(e) => setEditingAddress(e.target.value)}
                          placeholder="주소"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-gray-450 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editingParkingInfo}
                          onChange={(e) => setEditingParkingInfo(e.target.value)}
                          placeholder="주차 정보"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-gray-450 focus:outline-none"
                        />
                        <input
                          type="url"
                          value={editingMapUrl}
                          onChange={(e) => setEditingMapUrl(e.target.value)}
                          placeholder="카카오맵 URL"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-gray-450 focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditingId(null)}
                          disabled={isInProgress}
                          className="rounded-2xl border border-gray-205 bg-white hover:bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 transition-all active:scale-[0.95]"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleSaveLocation(loc.id)}
                          disabled={!editingName.trim() || isInProgress}
                          className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-4 py-2 text-xs font-bold text-gray-900 transition-all active:scale-[0.95]"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-gray-900">{loc.name}</span>
                          {loc.is_active ? (
                            <span className="inline-flex items-center rounded-2xl bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                              활성
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-2xl bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-600">
                              비활성
                            </span>
                          )}
                        </div>
                        
                        {(loc.address || loc.parking_info || loc.map_url) && (
                          <div className="text-xs text-gray-500 space-y-1 pt-1">
                            {loc.address && <p>📍 {loc.address}</p>}
                            {loc.parking_info && <p>🚗 {loc.parking_info}</p>}
                            {loc.map_url && (
                              <a href={loc.map_url} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
                                🔗 지도 보기
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 편집 */}
                        <button
                          onClick={() => startEditing(loc)}
                          className="rounded-2xl p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
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
                          className={`rounded-2xl border px-3 py-1.5 text-[10px] font-bold transition-all active:scale-[0.95] disabled:opacity-50 ${
                            loc.is_active
                              ? 'border-red-200 bg-white hover:bg-red-50 text-red-650'
                              : 'border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-650'
                          }`}
                        >
                          {loc.is_active ? '비활성화' : '활성화'}
                        </button>

                        {/* 장소 삭제 */}
                        <button
                          onClick={() => handleDeleteLocation(loc.id, loc.name)}
                          disabled={isInProgress}
                          className="rounded-2xl border border-red-200 bg-white px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 transition-all active:scale-[0.95] disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
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
