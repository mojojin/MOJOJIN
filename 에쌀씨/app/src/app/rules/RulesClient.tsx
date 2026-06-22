'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface RulesClientProps {
  isAdmin: boolean
}

export default function RulesClient({ isAdmin }: RulesClientProps) {
  const supabase = createClient()
  const [content, setContent] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [tempContent, setTempContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const defaultRules = `안녕하세요, Suwon Running Crew (SRC) 입니다.
에쌀씨는 친목보다 러닝을 우선하며 서로의 성장을 위해 함께 달리는 러닝 크루입니다.

제 1 장 총칙
제1조 [명칭]
본 모임의 정식 명칭은 Suwon Running Crew (에쌀씨) 로 한다.

제2조 [목적]
에쌀씨는 '친목'보다 '러닝'을 우선하여 서로의 성장을 위해 달리는 것을 목적으로 한다.

[여기에 회칙 세부 내용을 자유롭게 입력하세요...]`

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('system_settings').select('setting_value').eq('setting_key', 'rules_content').single()
    
    if (data) {
      setContent((data as any).setting_value)
      setTempContent((data as any).setting_value)
    } else {
      setContent(defaultRules)
      setTempContent(defaultRules)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // UPSERT
    const { error } = await (supabase as any).from('system_settings').upsert({
      setting_key: 'rules_content',
      setting_value: tempContent
    })

    if (error) {
      alert('저장 실패!')
      console.error(error)
    } else {
      setContent(tempContent)
      setIsEditing(false)
      alert('성공적으로 저장되었습니다!')
    }
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-8 pb-24 font-sans">
      <div className="mx-auto max-w-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-2xl bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">크루 회칙</h1>
              <p className="text-xs text-gray-500 mt-0.5">수원 러닝 크루 공식 운영 규정</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && !isEditing && (
              <button onClick={() => setIsEditing(true)}
                className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-4 py-2 text-xs font-bold text-gray-900 hover:bg-[#b8e600] active:scale-95 transition-all">
                회칙 수정
              </button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)}
                  className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 active:scale-95 transition-all">
                  취소
                </button>
                <button onClick={handleSave} disabled={isSaving}
                  className="rounded-2xl bg-[#CCFF00] border border-[#b8e600] px-4 py-2 text-xs font-bold text-gray-900 hover:bg-[#b8e600] active:scale-95 transition-all disabled:opacity-50">
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
        ) : isEditing ? (
          <div className="space-y-4 animate-in fade-in duration-100">
            <p className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              💡 팁: 빈 줄을 사용하여 문단을 나누세요. 저장 즉시 모든 사용자에게 반영됩니다.
            </p>
            <textarea
              className="w-full h-[60vh] bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-900 leading-relaxed focus:border-gray-400 outline-none resize-none focus:ring-0"
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 space-y-1 shadow-sm">
            {content.split('\n').map((line, idx) => {
              if (line.trim() === '') return <div key={idx} className="h-4" />
              if (line.startsWith('제') && line.includes('장')) {
                return <h2 key={idx} className="text-base font-extrabold text-gray-900 mt-6 mb-2 border-l-4 border-[#CCFF00] pl-3 pb-0.5">{line}</h2>
              }
              if (line.startsWith('제') && line.includes('조')) {
                return <h3 key={idx} className="text-sm font-bold text-gray-900 mt-4 pl-1">{line}</h3>
              }
              return <p key={idx} className="text-xs text-gray-600 leading-relaxed pl-1">{line}</p>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
