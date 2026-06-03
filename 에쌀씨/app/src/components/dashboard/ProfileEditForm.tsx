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
  const supabase = createClient()
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

  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white tracking-tight">⚙️ 내 정보 수정</h2>
        <button
          onClick={onClose}
          className="rounded-full bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 닉네임 입력 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 pl-1">
            닉네임 <span className="text-emerald-400">*</span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="사용하실 닉네임"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
            required
          />
        </div>

        {/* 연락처 입력 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 pl-1">
            연락처 (선택)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-gray-500 pl-1">운영진에게만 공개됩니다.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 font-medium text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            mt-2 w-full py-3.5 rounded-xl
            bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50
            text-black font-extrabold text-sm tracking-wide
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
    </div>
  )
}
