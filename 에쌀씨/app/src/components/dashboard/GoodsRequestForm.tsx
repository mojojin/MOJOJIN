'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface GoodsRequestFormProps {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function GoodsRequestForm({ userId, onClose, onSuccess }: GoodsRequestFormProps) {
  const supabase = createClient() as any
  
  const [goodsType, setGoodsType] = useState<'TSHIRT' | 'SOCKS'>('TSHIRT')
  const [size, setSize] = useState<string>('FREE')
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const tshirtSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL']
  const socksSizes = ['FREE']

  const currentSizes = goodsType === 'TSHIRT' ? tshirtSizes : socksSizes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const { error } = await supabase
        .from('goods_requests')
        .insert({
          user_id: userId,
          goods_type: goodsType,
          size: size,
          status: 'PENDING'
        })

      if (error) {
        if (error.code === '42P01') {
          throw new Error('goods_requests 테이블이 아직 생성되지 않았습니다. 관리자에게 문의하세요.')
        }
        throw error
      }

      alert('굿즈 신청이 완료되었습니다! 🎁')
      onSuccess()
    } catch (err: any) {
      console.error('굿즈 신청 에러:', err)
      setErrorMsg(err.message || '신청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (type: 'TSHIRT' | 'SOCKS') => {
    setGoodsType(type)
    setSize(type === 'TSHIRT' ? 'L' : 'FREE')
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          🎁 SRC 굿즈 신청
        </h3>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2">신청 품목</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('TSHIRT')}
              className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-colors ${
                goodsType === 'TSHIRT' 
                  ? 'bg-gray-900 border-gray-900 text-white' 
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              티셔츠 👕
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('SOCKS')}
              className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-colors ${
                goodsType === 'SOCKS' 
                  ? 'bg-[#CCFF00] border-[#b8e600] text-gray-900' 
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              러닝 양말 🧦
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2">사이즈 선택</label>
          <div className="flex flex-wrap gap-2">
            {currentSizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`py-2 px-4 rounded-lg border text-xs font-bold transition-colors ${
                  size === s
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
            🚨 {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-2 rounded-xl bg-[#CCFF00] text-gray-900 font-extrabold text-sm hover:bg-[#b8e600] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : '신청하기'}
        </button>
      </form>
    </div>
  )
}
