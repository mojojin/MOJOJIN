'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface GoodsRequestFormProps {
  userId: string
  goodsType?: 'TSHIRT' | 'SOCKS'
  editingRequest?: any
  onClose?: () => void
  onSuccess: () => void
}

interface CartItem {
  id: string
  color: string
  size: string
  count: number
}

export default function GoodsRequestForm({ userId, goodsType = 'TSHIRT', editingRequest, onClose, onSuccess }: GoodsRequestFormProps) {
  const supabase = createClient() as any
  
  const isTshirt = goodsType === 'TSHIRT'
  const PRICE_PER_ITEM = isTshirt ? 23000 : 5000
  const title = isTshirt ? '에쌀씨 티셔츠' : '에쌀씨 양말'
  const colors = isTshirt ? ['블랙', '화이트'] : ['레드', '블루', '그린']
  const sizes = isTshirt ? ['S', 'M', 'L', 'XL'] : ['남성(250~280)', '여성(220~250)']
  
  const [buyerInfo, setBuyerInfo] = useState('')
  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [selectedSize, setSelectedSize] = useState(sizes[0])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isPaid, setIsPaid] = useState<boolean | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // 실시간 재고 관리 상태
  const [inventory, setInventory] = useState<any[]>([])

  // goodsType이나 editingRequest가 변경되면 상태 초기화
  useEffect(() => {
    if (editingRequest && editingRequest.goods_type === goodsType) {
      setBuyerInfo(editingRequest.details?.buyerInfo || '')
      setCart(editingRequest.details?.items || [])
      setIsPaid(editingRequest.details?.isPaid || false)
    } else {
      setSelectedColor(colors[0])
      setSelectedSize(sizes[0])
      setCart([])
      setIsPaid(null)
    }
  }, [goodsType, editingRequest])

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('nickname').eq('id', userId).single()
      if (data?.nickname) setBuyerInfo(data.nickname)
    }
    fetchProfile()

    const fetchInventory = async () => {
      const { data, error } = await supabase.from('goods_inventory').select('*').eq('goods_type', goodsType)
      if (!error && data) setInventory(data)
    }
    fetchInventory()

    const channel = supabase
      .channel(`public:goods_inventory:${goodsType}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goods_inventory' }, () => fetchInventory())
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, goodsType])

  // 현재 선택한 옵션의 남은 재고량 확인
  const getCurrentStock = (color: string, size: string) => {
    const item = inventory.find(i => i.color === color && i.size === size)
    return item ? item.stock : 0
  }

  const handleAddToCart = () => {
    const stock = getCurrentStock(selectedColor, selectedSize)
    if (inventory.length > 0 && stock <= 0) return alert('해당 색상/사이즈는 품절되었습니다.')

    const existing = cart.find(item => item.color === selectedColor && item.size === selectedSize)
    if (existing) {
      if (existing.count >= stock) return alert(`현재 남은 재고가 ${stock}개뿐입니다!`)
      setCart(cart.map(item => item.id === existing.id ? { ...item, count: item.count + 1 } : item))
    } else {
      setCart([...cart, { id: Math.random().toString(), color: selectedColor, size: selectedSize, count: 1 }])
    }
  }

  const handleRemoveFromCart = (id: string) => setCart(cart.filter(item => item.id !== id))
  
  const handleCountChange = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const stock = getCurrentStock(item.color, item.size)
        const newCount = Math.max(1, item.count + delta)
        if (newCount > stock) {
          alert(`현재 남은 재고가 ${stock}개뿐입니다!`)
          return item
        }
        return { ...item, count: newCount }
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
      if (editingRequest) {
        // 수정 시 기존 재고 임시 복구 (로컬 상태 및 DB 업데이트)
        if (inventory.length > 0 && editingRequest.details?.items) {
          for (const oldItem of editingRequest.details.items) {
            const invItem = inventory.find(i => i.color === oldItem.color && i.size === oldItem.size)
            if (invItem && invItem.id) {
              await supabase.from('goods_inventory').update({ stock: invItem.stock + oldItem.count }).eq('id', invItem.id)
              invItem.stock += oldItem.count // 로컬 상태도 업데이트하여 차감 시 올바른 값 참조
            }
          }
        }
        
        const { error } = await supabase.from('goods_requests').update({
          size: cart.length === 1 ? cart[0].size : 'MIXED',
          details: {
            buyerInfo,
            items: cart,
            totalPrice,
            isPaid
          }
        }).eq('id', editingRequest.id)
        if (error) throw error

      } else {
        const { error } = await supabase
          .from('goods_requests')
          .insert({
            user_id: userId,
            goods_type: goodsType,
            size: cart.length === 1 ? cart[0].size : 'MIXED',
            details: {
              buyerInfo,
              items: cart,
              totalPrice,
              isPaid
            },
            status: 'PENDING'
          })

        if (error) throw error
      }

      if (inventory.length > 0) {
        for (const item of cart) {
          const invItem = inventory.find(i => i.color === item.color && i.size === item.size)
          if (invItem && invItem.id) {
            const newStock = Math.max(0, invItem.stock - item.count)
            await supabase.from('goods_inventory').update({ stock: newStock }).eq('id', invItem.id)
          }
        }
      }

      alert(editingRequest ? '수정이 완료되었습니다!' : `${title} 구입 신청이 완료되었습니다! ${isTshirt ? '👕' : '🧦'}`)
      onSuccess()
    } catch (err: any) {
      console.error('굿즈 신청 에러:', err)
      setErrorMsg(err.message || '신청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 색상 뱃지 유틸
  const getColorBadge = (colorName: string) => {
    if (colorName === '블랙') return 'bg-black'
    if (colorName === '화이트') return 'bg-white border border-gray-200'
    if (colorName === '레드') return 'bg-red-500'
    if (colorName === '블루') return 'bg-blue-500'
    if (colorName === '그린') return 'bg-green-500'
    return 'bg-gray-200'
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-50/50 min-h-screen pb-12">
      <div className="bg-white px-6 py-8 border-b border-gray-100 shadow-sm relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{title}<br/>구입 신청서 {isTshirt ? '👕' : '🧦'}</h1>
        
        <div className="mt-5 space-y-2 text-sm text-gray-600 font-medium">
          <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-900 block rounded-full"></span> 신청기한 : 재고 소진 시</p>
          <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-900 block rounded-full"></span> 색상 : {colors.join(', ')}</p>
          <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-900 block rounded-full"></span> 금액 : <strong className="text-gray-900">{PRICE_PER_ITEM.toLocaleString()}원</strong> ({isTshirt ? '장당' : '켤레'})</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {isTshirt ? (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4">📏 티셔츠 실측 사이즈 (단면/cm)</h3>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-center text-xs">
                <thead className="bg-gray-50 text-gray-500 text-[10px]">
                  <tr><th className="py-2.5 font-bold">사이즈</th><th className="py-2.5 font-bold">총장</th><th className="py-2.5 font-bold">어깨</th><th className="py-2.5 font-bold">가슴</th><th className="py-2.5 font-bold">소매길이</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  <tr><td className="py-2.5 font-bold text-gray-900 bg-gray-50/50">S</td><td>63</td><td>42</td><td>51</td><td>19</td></tr>
                  <tr><td className="py-2.5 font-bold text-gray-900 bg-gray-50/50">M</td><td>65</td><td>42.5</td><td>53</td><td>20</td></tr>
                  <tr><td className="py-2.5 font-bold text-gray-900 bg-gray-50/50">L</td><td>66</td><td>44</td><td>55</td><td>20</td></tr>
                  <tr><td className="py-2.5 font-bold text-gray-900 bg-gray-50/50">XL</td><td>68</td><td>45</td><td>56</td><td>21</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-center">
            <h3 className="text-lg font-black text-gray-900 mb-2">최고급 코마사 양말 🧦</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed font-medium">
              100% 고품질 국내 원사를 사용하여<br/>
              정직하고 까다로운 공정을 통해 제작했습니다.<br/>
              저가의 중국산 제품과는 비교불가하며<br/>
              보풀이 적게 일어나고 내구성이 강합니다.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-extrabold text-gray-900 mb-3">
              1. 신청자 이름/나이/성별 입력해주세요 <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={buyerInfo}
              onChange={(e) => setBuyerInfo(e.target.value)}
              placeholder="ex) 박병진/88/남" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400 shadow-inner"
            />
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-extrabold text-gray-900 mb-4">
              2. 색상과 사이즈를 담아주세요 <span className="text-red-500">*</span>
            </label>
            
            <div className="space-y-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
              {goodsType === 'SOCKS' && (
                <div className="w-full h-24 sm:h-28 bg-white rounded-xl overflow-hidden border border-gray-150 shadow-sm flex items-center justify-center relative isolate">
                  <div className="absolute inset-0 flex flex-col items-center justify-center -z-10">
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest mb-1.5">COLOR GUIDE</p>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-[10px] font-bold text-gray-400">레드</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold text-gray-400">블루</span></div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-[10px] font-bold text-gray-400">그린</span></div>
                    </div>
                  </div>
                  <img src="/images/socks_colors.jpg" alt="양말 색상 참고" className="w-full h-full object-cover object-center transition-all duration-300 z-10 bg-white" 
                    onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                {colors.map(color => (
                  <button type="button" key={color} onClick={() => setSelectedColor(color)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${selectedColor === color ? 'bg-gray-900 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full shadow-sm ${getColorBadge(color)}`}></span>
                    {color}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                {sizes.map(sz => {
                  const stock = getCurrentStock(selectedColor, sz)
                  const isSoldOut = inventory.length > 0 && stock <= 0
                  
                  return (
                    <button type="button" key={sz} onClick={() => setSelectedSize(sz)} disabled={isSoldOut}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        isSoldOut 
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                          : selectedSize === sz 
                            ? 'bg-gray-900 text-white shadow-md' 
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{sz}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSoldOut 
                          ? 'bg-gray-200 text-gray-500' 
                          : selectedSize === sz 
                            ? 'bg-gray-700 text-gray-100' 
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isSoldOut ? '[품절]' : `(${stock}개 남음)`}
                      </span>
                    </button>
                  )
                })}
              </div>

              <button type="button" onClick={handleAddToCart}
                className="w-full mt-4 py-3 bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 font-black rounded-xl border border-[#b8e600] shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                장바구니 담기
              </button>
            </div>

            {cart.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h4 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
                  🛒 담긴 상품 <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cart.length}</span>
                </h4>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.color} / {item.size}</p>
                        <p className="text-xs text-gray-500 mt-1">{PRICE_PER_ITEM.toLocaleString()}원</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                          <button type="button" onClick={() => handleCountChange(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">-</button>
                          <span className="w-8 text-center text-xs font-bold text-gray-900">{item.count}</span>
                          <button type="button" onClick={() => handleCountChange(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">+</button>
                        </div>
                        <button type="button" onClick={() => handleRemoveFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-gray-900 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
                  <span className="text-sm font-bold opacity-80">총 {totalCount}개</span>
                  <span className="text-lg font-black text-[#CCFF00] tracking-tight">{totalPrice.toLocaleString()}원</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-extrabold text-gray-900 mb-4">
              {isTshirt ? '3. ' : '4. '}구입 금액 확인 후 해당 계좌로 입금하셨나요? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs font-bold text-gray-900 underline underline-offset-4 decoration-[#CCFF00] decoration-4 mb-4">폼 작성 후 박병진 태그해주세요</p>
            
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm space-y-3 mb-5 font-medium text-gray-700">
              {isTshirt ? (
                <>
                  <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 block rounded-full"></span> 1장 : 23,000원</p>
                  <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 block rounded-full"></span> 2장 : 46,000원</p>
                  <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 block rounded-full"></span> 3장 : 69,000원</p>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <p className="text-gray-900 font-black">🏢 국민은행 <span className="font-mono">307002-04-099981</span></p>
                  <p className="text-gray-600 font-bold">👤 예금주: 박병진</p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 block rounded-full"></span> 1켤레 : 5,000원</p>
                  <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 block rounded-full"></span> 2켤레 : 10,000원</p>
                  <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 block rounded-full"></span> 3켤레 : 15,000원</p>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <p className="text-gray-900 font-black">🏢 국민은행 <span className="font-mono">307002-04-099981</span></p>
                  <p className="text-gray-600 font-bold">👤 예금주: 박병진</p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${isPaid === true ? 'border-[#CCFF00] bg-[#fcffeb]' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                <input type="radio" name="paid" className="hidden" checked={isPaid === true} onChange={() => setIsPaid(true)} />
                <span className={`text-sm font-bold ${isPaid === true ? 'text-gray-900' : 'text-gray-500'}`}>네, 입금했습니다</span>
              </label>
              <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${isPaid === false ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                <input type="radio" name="paid" className="hidden" checked={isPaid === false} onChange={() => setIsPaid(false)} />
                <span className={`text-sm font-bold ${isPaid === false ? 'text-red-700' : 'text-gray-500'}`}>아니요</span>
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm text-red-700 font-bold">{errorMsg}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gray-900 hover:bg-black text-[#CCFF00] font-black rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-lg tracking-wide"
          >
            {loading ? '신청 처리 중...' : '제출하기'}
          </button>
        </form>

        <div className="text-center space-y-1 pb-4">
          <p className="text-[10px] text-gray-400 font-medium">관리자 확인 후 내역이 반영됩니다.</p>
          <p className="text-[10px] text-gray-400 font-medium">문의사항은 관리자에게 연락주세요.</p>
        </div>
      </div>
    </div>
  )
}
