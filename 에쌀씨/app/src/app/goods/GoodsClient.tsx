'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GoodsRequestForm from '@/components/dashboard/GoodsRequestForm'
import { createClient } from '@/lib/supabase/client'

export default function GoodsClient({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient() as any
  const [activeTab, setActiveTab] = useState<'TSHIRT' | 'SOCKS'>('TSHIRT')
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [editingRequest, setEditingRequest] = useState<any>(null)

  const fetchMyRequests = async () => {
    const { data } = await supabase
      .from('goods_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setMyRequests(data)
  }

  useEffect(() => {
    fetchMyRequests()
  }, [userId])

  const handleDelete = async (req: any) => {
    if (!confirm('정말 이 신청을 취소(삭제)하시겠습니까? (차감된 재고는 자동 복구됩니다)')) return
    
    try {
      // 복구 로직
      if (req.details?.items && req.status !== 'CANCELED') {
        const { data: invData } = await supabase.from('goods_inventory').select('*').eq('goods_type', req.goods_type)
        if (invData) {
          for (const item of req.details.items) {
            const invItem = invData.find((i: any) => i.color === item.color && i.size === item.size)
            if (invItem && invItem.id) {
              await supabase.from('goods_inventory').update({ stock: invItem.stock + item.count }).eq('id', invItem.id)
            }
          }
        }
      }
      const { error } = await supabase.from('goods_requests').delete().eq('id', req.id)
      if (error) throw error

      alert('신청이 취소되었습니다.')
      if (editingRequest?.id === req.id) setEditingRequest(null)
      fetchMyRequests()
    } catch (e: any) {
      console.error(e)
      alert(`취소 중 오류가 발생했습니다: ${e.message}`)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto mt-10 space-y-4">
      {/* 나의 신청 내역 */}
      {myRequests.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center justify-between">
            <span>📋 나의 신청 내역</span>
            <span className="text-[10px] text-gray-400 font-normal">대기중일 때만 수정/취소 가능</span>
          </h3>
          <div className="space-y-3">
            {myRequests.map((req) => (
              <div key={req.id} className="border border-gray-150 bg-gray-50/50 p-3.5 rounded-xl flex flex-col gap-2 relative overflow-hidden">
                {editingRequest?.id === req.id && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#CCFF00]" />
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold bg-gray-200 px-2 py-0.5 rounded text-gray-700 mr-2">
                      {req.goods_type === 'TSHIRT' ? '👕 티셔츠' : '🧦 양말'}
                    </span>
                    <span className="text-[10px] text-gray-500">{String(req.created_at).substring(5, 16).replace('T', ' ')}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    req.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    req.status === 'CANCELED' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                    'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                    {req.status === 'COMPLETED' ? '지급완료' : req.status === 'CANCELED' ? '취소됨' : '대기중'}
                  </span>
                </div>
                
                <div className="text-xs text-gray-800 font-medium pl-1 bg-white p-2 rounded-lg border border-gray-100 mt-1">
                  {req.details?.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-0.5">
                      <span>{item.color} {item.size}</span>
                      <span className="text-gray-500">{item.count}장</span>
                    </div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400">총 결제금액</span>
                    <span className="font-bold text-red-500">{req.details?.totalPrice?.toLocaleString()}원</span>
                  </div>
                </div>
                
                {req.status === 'PENDING' && (
                  <div className="flex justify-end gap-2 mt-2">
                    <button 
                      onClick={() => {
                        setActiveTab(req.goods_type)
                        setEditingRequest(req)
                        setTimeout(() => {
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                        }, 100)
                      }}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border ${
                        editingRequest?.id === req.id 
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'text-gray-700 bg-white hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      {editingRequest?.id === req.id ? '수정 중...' : '수정'}
                    </button>
                    <button 
                      onClick={() => handleDelete(req)}
                      className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors border border-red-100"
                    >
                      신청 취소
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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

      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          {editingRequest ? '✏️ 신청 내역 수정하기' : '✨ 굿즈 신규 신청'}
          {editingRequest && (
            <button 
              onClick={() => setEditingRequest(null)}
              className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200 ml-auto"
            >
              수정 취소
            </button>
          )}
        </h2>
        
        <GoodsRequestForm 
          userId={userId} 
          goodsType={activeTab}
          editingRequest={editingRequest}
          onSuccess={() => {
            fetchMyRequests()
            setEditingRequest(null)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }} 
        />
      </div>
    </div>
  )
}
