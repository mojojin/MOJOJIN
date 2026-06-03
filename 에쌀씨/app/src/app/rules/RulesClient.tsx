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
    <div className="min-h-screen bg-gray-950 text-gray-200 px-4 py-8 pb-24">
      <div className="mx-auto max-w-2xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">📜 SRC 회칙</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20">
                ✏️ 수정
              </button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="rounded-xl border border-gray-500/30 px-3 py-2 text-sm font-bold text-gray-400">취소</button>
                <button onClick={handleSave} disabled={isSaving} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-50">
                  {isSaving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            )}
            {!isEditing && (
              <Link href="/dashboard" className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/10 transition-colors">
                돌아가기
              </Link>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">불러오는 중...</div>
        ) : isEditing ? (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-xs text-amber-500 font-bold bg-amber-500/10 p-3 rounded-lg">💡 팁: 빈 줄을 사용하여 문단을 나누세요. 저장 즉시 모든 사용자에게 반영됩니다.</p>
            <textarea
              className="w-full h-[60vh] bg-black/50 border border-white/10 rounded-2xl p-6 text-sm text-gray-200 leading-relaxed focus:border-emerald-500/50 outline-none resize-none"
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-900/50 border border-white/5 p-6 md:p-8 space-y-1">
            {content.split('\n').map((line, idx) => {
              if (line.trim() === '') return <div key={idx} className="h-4" />
              if (line.startsWith('제') && line.includes('장')) {
                return <h2 key={idx} className="text-lg font-black text-emerald-400 mt-6 mb-2 border-b border-white/5 pb-2">{line}</h2>
              }
              if (line.startsWith('제') && line.includes('조')) {
                return <h3 key={idx} className="text-base font-bold text-white mt-4">{line}</h3>
              }
              return <p key={idx} className="text-sm text-gray-300 leading-relaxed pl-2">{line}</p>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
