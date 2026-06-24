'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ProfileEditFormProps {
  userId: string
  initialNickname: string
  initialPhone: string
  onSuccess: (updatedProfile: Partial<Profile>) => void
  onClose: () => void
}

export default function ProfileEditForm({
  userId,
  initialNickname,
  initialPhone,
  onSuccess,
  onClose,
}: ProfileEditFormProps) {
  const supabase = createClient() as any
  const [nickname, setNickname] = useState(initialNickname)
  const [phone, setPhone] = useState(initialPhone)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 닉네임 중복 체크 (본인 제외)
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nickname.trim())
        .neq('id', userId)
        .single()

      if (existingUser) {
        throw new Error('이미 사용 중인 닉네임입니다.')
      }
      
      // DB가 못 찾았을 때 에러(PGRST116: JSON object requested, multiple (or no) rows returned)는 정상이므로 무시
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      // 프로필 업데이트
      const updates = {
        nickname: nickname.trim(),
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (updateError) throw updateError

      onSuccess(updates)
      onClose()
    } catch (err: any) {
      console.error('프로필 수정 에러:', err)
      setError(err.message || '프로필 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      window.location.href = '/'
    } catch (err) {
      console.error('로그아웃 에러:', err)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">내 정보 수정</h2>
        <button
          onClick={onClose}
          className="rounded-full bg-gray-50 p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 닉네임 입력 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 pl-1">
            닉네임 <span className="text-[#CCFF00]">*</span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="사용하실 닉네임"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none transition-colors"
            required
          />
        </div>

        {/* 연락처 입력 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 pl-1">
            연락처 (선택)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-gray-400 pl-1">운영진에게만 공개됩니다.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            mt-2 w-full py-3.5 rounded-xl
            bg-[#CCFF00] hover:bg-[#b8e600] disabled:opacity-50
            text-gray-900 font-extrabold text-sm tracking-wide
            transition-all duration-200 active:scale-[0.98]
            flex items-center justify-center
          "
        >
          {isSubmitting ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            '수정 완료'
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-gray-100 flex justify-center">
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs font-semibold text-red-500 hover:text-red-700 underline transition-all flex items-center gap-1.5 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          로그아웃하기
        </button>
      </div>
    </div>
  )
}
