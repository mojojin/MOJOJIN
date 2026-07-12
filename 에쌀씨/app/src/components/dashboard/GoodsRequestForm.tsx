'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface GoodsRequestFormProps {
  userId: string
  onClose?: () => void
  onSuccess: () => void
}

interface CartItem {
  id: string
  color: string
  size: string
  count: number
}

export default function GoodsRequestForm({ userId, onClose, onSuccess }: GoodsRequestFormProps) {
  const supabase = createClient() as any
  
  const [buyerInfo, setBuyerInfo] = useState('')
  const [selectedColor, setSelectedColor] = useState('블랙')
  const [selectedSize, setSelectedSize] = useState('L')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isPaid, setIsPaid] = useState<boolean | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const PRICE_PER_ITEM = 23000

  // 로그인 유저의 닉네임을 기본값으로 가져옴
  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('nickname').eq('id', userId).single()
      if (data?.nickname) {
        setBuyerInfo(data.nickname)
      }
    }
    fetchProfile()
  }, [userId, supabase])

  const handleAddToCart = () => {
    const existing = cart.find(item => item.color === selectedColor && item.size === selectedSize)
    if (existing) {
      setCart(cart.map(item => item.id === existing.id ? { ...item, count: item.count + 1 } : item))
    } else {
      setCart([...cart, { id: Math.random().toString(), color: selectedColor, size: selectedSize, count: 1 }])
    }
  }

  const handleRemoveFromCart = (id: string) => setCart(cart.filter(item => item.id !== id))
  
  const handleCountChange = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        return { ...item, count: Math.max(1, item.count + delta) }
      }
      return item
    }))
  }

  const totalCount = cart.reduce((acc, item) => acc + item.count, 0)
  const totalPrice = totalCount * PRICE_PER_ITEM

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyerInfo.trim()) return setErrorMsg('신청자 정보를 입력해주세요.')
    if (cart.length === 0) return setErrorMsg('상품 옵션을 선택하고 장바구니에 담아주세요.')
    if (isPaid !== true) return setErrorMsg('입금 확인 여부에 "네"를 선택해주세요.')

    setLoading(true)
    setErrorMsg(null)

    try {
      const { error } = await supabase
        .from('goods_requests')
        .insert({
          user_id: userId,
          goods_type: 'TSHIRT',
          size: cart.length === 1 ? cart[0].size : 'MIXED',
          details: {
            buyerInfo,
            items: cart,
            totalPrice,
            isPaid
          },
          status: 'PENDING'
        })

      if (error) {
        if (error.message?.includes('column "details"')) {
          throw new Error('데이터베이스 업데이트(details 컬럼 추가)가 필요합니다. 관리자에게 문의하세요.')
        }
        throw error
      }

      alert('티셔츠 구입 신청이 완료되었습니다! 👕')
      onSuccess()
    } catch (err: any) {
      console.error('굿즈 신청 에러:', err)
      setErrorMsg(err.message || '신청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-50/50 min-h-screen pb-12">
      {/* Header Title Area */}
      <div className="bg-white px-6 py-8 border-b border-gray-100 shadow-sm relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">에쌀씨 티셔츠<br/>구입 신청서 👕</h1>
        
        <div className="mt-5 space-y-2 text-sm text-gray-600 font-medium">
          <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-900 block rounded-full"></span> 신청기한 : 재고 소진 시</p>
          <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-900 block rounded-full"></span> 색상 : 블랙, 화이트</p>
          <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-900 block rounded-full"></span> 금액 : <strong className="text-gray-900">23,000원</strong> (장당)</p>
        </div>
        
        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-900 leading-relaxed">
          <strong>※ 선택하신 사이즈 재고가 없을 시 안내 후 다른 사이즈로 대체 가능합니다.</strong><br/>
          (블랙 L 9 / XL 2 / M 4 / S 11)<br/>
          (화이트 L 3 / M 1 / S 4)
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* 사이즈 가이드 표 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4">📏 티셔츠 실측 사이즈 (단면/cm)</h3>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-center text-xs">
              <thead className="bg-gray-50 text-gray-500 text-[10px]">
                <tr>
                  <th className="py-2.5 font-bold">사이즈</th>
                  <th className="py-2.5 font-bold">총장</th>
                  <th className="py-2.5 font-bold">어깨</th>
                  <th className="py-2.5 font-bold">가슴</th>
                  <th className="py-2.5 font-bold">소매길이</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                <tr><td className="py-2.5 font-bold text-gray-900 bg-gray-50/50">S</td><td>63</td><td>42</td><td>51</td><td>19</td></tr>
                <tr><td className="py-2.5 font-bold text-gray-900 bg-gray-50/50">M</td><td>65</td><td>42.5</td><td>53</td><td>20</td></tr>
                <tr><td className="py-2.5 font-bold text-gray-900 bg-gray-50/50">L</td><td>66</td><td>44</td><td>55</td><td>20</td></tr>
                <tr><td className="py-2.5 font-bold text-gray-900 bg-gray-50/50">XL</td><td>68</td><td>45</td><td>56</td><td>21</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">* 측정 방법에 따라 약간의 오차가 발생할 수 있습니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. 기본 정보 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-extrabold text-gray-900 mb-1">
              1. 신청자 이름/나이/성별 입력해주세요 <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">ex) 박병진/88/남</p>
            <input 
              type="text" 
              value={buyerInfo}
              onChange={(e) => setBuyerInfo(e.target.value)}
              placeholder="내 답변" 
              className="w-full border-b-2 border-gray-200 py-2 focus:outline-none focus:border-gray-900 transition-colors text-sm font-bold bg-transparent"
            />
          </div>

          {/* 2 & 3. 옵션 선택 영역 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-extrabold text-gray-900 mb-4">
              2. 색상과 사이즈를 담아주세요 <span className="text-red-500">*</span>
            </label>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {/* 색상 탭 */}
              <div className="flex gap-2">
                {['블랙', '화이트'].map(color => (
                  <button type="button" key={color} onClick={() => setSelectedColor(color)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedColor === color ? (color === '블랙' ? 'bg-gray-900 text-white border-transparent' : 'bg-white border-2 border-gray-900 text-gray-900 shadow-sm') : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              
              {/* 사이즈 탭 */}
              <div className="flex gap-2">
                {['S', 'M', 'L', 'XL'].map(sz => (
                  <button type="button" key={sz} onClick={() => setSelectedSize(sz)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedSize === sz ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <button type="button" onClick={handleAddToCart} className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]">
                옵션 장바구니에 담기 🛒
              </button>
            </div>

            {/* 담긴 옵션 (장바구니) */}
            {cart.length > 0 && (
              <div className="mt-4 space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold border border-gray-100">
                        {item.color[0]}{item.size}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{item.color} / {item.size}</p>
                        <p className="text-[10px] text-gray-400">{PRICE_PER_ITEM.toLocaleString()}원</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                        <button type="button" onClick={() => handleCountChange(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-l-lg">-</button>
                        <span className="w-6 text-center text-xs font-bold">{item.count}</span>
                        <button type="button" onClick={() => handleCountChange(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-r-lg">+</button>
                      </div>
                      <button type="button" onClick={() => handleRemoveFromCart(item.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. 결제 확인 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-extrabold text-gray-900 mb-2">
              4. 구입 금액 확인 후 해당 계좌로 입금하였나요? <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] font-bold text-blue-600 mb-4 bg-blue-50 py-1.5 px-3 rounded-lg inline-block">폼 작성 후 박병진 태그해주세요</p>
            
            <div className="bg-gray-900 text-white p-5 rounded-2xl mb-5 shadow-inner">
              <div className="flex justify-between items-end mb-4 border-b border-gray-700 pb-4">
                <span className="text-xs text-gray-400 font-medium">총 결제 금액 ({totalCount}장)</span>
                <span className="text-2xl font-black text-[#CCFF00]">{totalPrice.toLocaleString()}원</span>
              </div>
              <div className="text-sm space-y-1.5 font-medium text-gray-300">
                <p className="flex justify-between"><span>은행명</span> <span className="text-white font-bold">국민은행</span></p>
                <p className="flex justify-between"><span>계좌번호</span> <span className="text-white font-bold">307002-04-099981</span></p>
                <p className="flex justify-between"><span>예금주</span> <span className="text-white font-bold">박병진</span></p>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isPaid === true ? 'border-[#CCFF00] bg-[#fcffeb]' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="paid" className="w-4 h-4 text-[#CCFF00] focus:ring-[#CCFF00]" checked={isPaid === true} onChange={() => setIsPaid(true)} />
                <span className="text-sm font-bold text-gray-900">네, 입금 완료했습니다.</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isPaid === false ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="paid" className="w-4 h-4 text-red-500 focus:ring-red-500" checked={isPaid === false} onChange={() => setIsPaid(false)} />
                <span className="text-sm font-bold text-gray-900">아니오, 아직 안 했습니다.</span>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-2">
              <span>🚨</span> {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || totalCount === 0}
            className="w-full py-4 mt-4 rounded-2xl bg-[#CCFF00] text-gray-900 font-black text-lg hover:bg-[#b8e600] active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? '제출 중...' : `총 ${totalPrice.toLocaleString()}원 신청 완료하기`}
          </button>

        </form>
      </div>
    </div>
  )
}
