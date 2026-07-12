'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import GoodsRequestForm from '@/components/dashboard/GoodsRequestForm'

export default function GoodsClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'TSHIRT' | 'SOCKS'>('TSHIRT')

  return (
    <div className="w-full max-w-md mx-auto mt-10 space-y-4">
      {/* 탭 네비게이션 */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('TSHIRT')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'TSHIRT' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👕 SRC 티셔츠
        </button>
        <button
          onClick={() => setActiveTab('SOCKS')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'SOCKS' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🧦 에쌀씨 양말
        </button>
      </div>

      <GoodsRequestForm 
        userId={userId} 
        goodsType={activeTab}
        onSuccess={() => {
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        }} 
      />
    </div>
  )
}
