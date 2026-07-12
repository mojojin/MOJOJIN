'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import GoodsRequestForm from '@/components/dashboard/GoodsRequestForm'

export default function GoodsClient({ userId }: { userId: string }) {
  const router = useRouter()

  return (
    <div className="w-full max-w-md mx-auto mt-10">
      <GoodsRequestForm 
        userId={userId} 
        onSuccess={() => {
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        }} 
      />
    </div>
  )
}
