'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateSurvival, isDuesExemptRole, isRunningExempt, isJoinedThisMonth } from '@/utils/survival'
import { getKstDate, getKstMonthStr } from '@/utils/date'
import * as XLSX from 'xlsx'
import Tesseract from 'tesseract.js'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type DuesRow = Database['public']['Tables']['dues']['Row']
type ExpenseRow = Database['public']['Tables']['expenses']['Row']
type FinanceSummary = Database['public']['Tables']['finance_summaries']['Row']
type RunningRecord = Database['public']['Tables']['running_records']['Row']

interface FinanceManagerProps {
  initialProfiles: Profile[]
  currentUserId: string
}

export default function FinanceManager({ initialProfiles, currentUserId }: FinanceManagerProps) {
  const supabase = createClient() as any
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles.filter(p => p.role !== 'WAITING' && p.is_active))
  
  const currentUser = initialProfiles.find(p => p.id === currentUserId)
  const currentUserNickname = currentUser?.nickname || ''
  const isAdmin = currentUser?.role === 'OWNER' || currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN'
  const isOwner = currentUser?.role === 'OWNER'
  
  const [duesList, setDuesList] = useState<DuesRow[]>([])
  const [expensesList, setExpensesList] = useState<ExpenseRow[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [records, setRecords] = useState<RunningRecord[]>([])
  const [goodsList, setGoodsList] = useState<any[]>([])
  const [inventoryList, setInventoryList] = useState<any[]>([])
  
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'DUES' | 'EXPENSES' | 'GOODS'>('SUMMARY')
  const [isLoading, setIsLoading] = useState(true)
  const [ocrProgress, setOcrProgress] = useState<string | null>(null)
  
  // Previous Balance Edit State
  const [isEditingPrevBalance, setIsEditingPrevBalance] = useState(false)
  const [tempPrevBalance, setTempPrevBalance] = useState('')
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null)

  const currentDate = getKstDate()
  const defaultMonthStr = getKstMonthStr()
  const [selectedMonthStr, setSelectedMonthStr] = useState(defaultMonthStr)

  // 2026-06부터 현재 달+1 까지 월 목록 생성
  const monthOptions = useMemo(() => {
    const list = []
    const start = new Date(2026, 5) // 2026-06 (June 2026)
    const end = getKstDate()
    end.setMonth(end.getMonth() + 1) // current month + 1
    
    let current = new Date(start)
    while (current <= end) {
      const y = current.getFullYear()
      const m = String(current.getMonth() + 1).padStart(2, '0')
      list.push(`${y}-${m}`)
      current.setMonth(current.getMonth() + 1)
    }
    return list.reverse() // 최신 월 순 정렬
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedMonthStr])

  useEffect(() => {
    const channel = supabase
      .channel('finance-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dues' },
        () => {
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goods_requests' },
        () => {
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goods_inventory' },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedMonthStr])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [year, month] = selectedMonthStr.split('-').map(Number)
      const lastDay = new Date(year, month, 0).getDate()
      const endOfMonthStr = `${selectedMonthStr}-${String(lastDay).padStart(2, '0')}`

      const [dRes, eRes, sRes, rRes, pRes, gRes, iRes] = await Promise.all([
        supabase.from('dues').select('*').eq('target_month', selectedMonthStr),
        supabase.from('expenses').select(`*, profiles(nickname)`).gte('expense_date', `${selectedMonthStr}-01`).lte('expense_date', endOfMonthStr),
        supabase.from('finance_summaries').select('*').eq('target_month', selectedMonthStr).maybeSingle(),
        supabase.from('running_records').select('*').gte('run_date', `${selectedMonthStr}-01`).lte('run_date', endOfMonthStr),
        supabase.from('profiles').select('*').neq('role', 'WAITING').eq('is_active', true),
        supabase.from('goods_requests').select('*, profiles(nickname)').order('created_at', { ascending: false }),
        supabase.from('goods_inventory').select('*').order('color').order('size')
      ])
      
      if (dRes.data) setDuesList(dRes.data)
      if (eRes.data) setExpensesList(eRes.data as any)
      if (sRes.data) setSummary(sRes.data)
      if (rRes.data) setRecords(rRes.data)
      if (pRes.data) setProfiles(pRes.data)
      if (gRes.data) setGoodsList(gRes.data)
      if (iRes?.data) setInventoryList(iRes.data)
    } catch (err: any) {
      if (err.message && !err.message.includes('relation "goods_inventory" does not exist')) {
        console.error(err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 통계 계산
  const totalIncome = duesList.filter(d => d.status === 'PAID').reduce((sum, d) => sum + d.amount, 0)
  const totalExpense = expensesList.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0)
  const prevBalance = summary?.previous_balance || 0
  const currentBalance = prevBalance + totalIncome - totalExpense

  const handleUpdatePrevBalance = async () => {
    const val = parseInt(tempPrevBalance, 10)
    if (isNaN(val)) return alert('올바른 숫자를 입력하세요.')
    
    setIsLoading(true)
    if (summary) {
      const { data } = await supabase.from('finance_summaries').update({ previous_balance: val }).eq('id', summary.id).select().single()
      if (data) setSummary(data)
    } else {
      const { data } = await supabase.from('finance_summaries').insert({ target_month: selectedMonthStr, previous_balance: val }).select().single()
      if (data) setSummary(data)
    }
    setIsEditingPrevBalance(false)
    setIsLoading(false)
  }

  const handleUpdateInventory = async (id: string | null, type: string, color: string, size: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta)
    try {
      if (id) {
        await supabase.from('goods_inventory').update({ stock: newStock }).eq('id', id)
      } else {
        await supabase.from('goods_inventory').insert({ goods_type: type, color, size, stock: newStock })
      }
      // fetchData() will be called by realtime subscription
    } catch (err: any) {
      console.error('재고 업데이트 에러:', err)
      if (err.message?.includes('relation "goods_inventory" does not exist')) {
        alert('데이터베이스 업데이트(goods_inventory 테이블 생성)가 필요합니다.')
      } else {
        alert('업데이트 중 오류가 발생했습니다.')
      }
    }
  }

  const handleToggleExpensesVisible = async () => {
    if (!isOwner) {
      return alert('설정 변경 권한이 없습니다 (크루장 전용).')
    }

    try {
      if (summary) {
        const nextVisible = !summary.is_expenses_visible
        const { data, error } = await supabase
          .from('finance_summaries')
          .update({ is_expenses_visible: nextVisible })
          .eq('id', summary.id)
          .select()
          .single()
        
        if (error) throw error
        if (data) setSummary(data)
      } else {
        const { data, error } = await supabase
          .from('finance_summaries')
          .insert({
            target_month: selectedMonthStr,
            previous_balance: 0,
            is_expenses_visible: true
          })
          .select()
          .single()
        
        if (error) throw error
        if (data) setSummary(data)
      }
    } catch (err) {
      console.error(err)
      alert('공개 설정을 변경하는 중 오류가 발생했습니다.')
    }
  }

  const handleToggleBalanceVisible = async () => {
    if (!isOwner) {
      return alert('설정 변경 권한이 없습니다 (크루장 전용).')
    }

    try {
      if (summary) {
        const nextVisible = !summary.is_balance_visible
        const { data, error } = await supabase
          .from('finance_summaries')
          .update({ is_balance_visible: nextVisible })
          .eq('id', summary.id)
          .select()
          .single()
        
        if (error) throw error
        if (data) setSummary(data)
      } else {
        const { data, error } = await supabase
          .from('finance_summaries')
          .insert({
            target_month: selectedMonthStr,
            previous_balance: 0,
            is_balance_visible: true
          })
          .select()
          .single()
        
        if (error) throw error
        if (data) setSummary(data)
      }
    } catch (err) {
      console.error(err)
      alert('공개 설정을 변경하는 중 오류가 발생했습니다.')
    }
  }

  const handleToggleDuesVisible = async () => {
    if (!isOwner) {
      return alert('설정 변경 권한이 없습니다 (크루장 전용).')
    }

    try {
      if (summary) {
        const nextVisible = !summary.is_dues_visible
        const { data, error } = await supabase
          .from('finance_summaries')
          .update({ is_dues_visible: nextVisible })
          .eq('id', summary.id)
          .select()
          .single()
        
        if (error) throw error
        if (data) setSummary(data)
      } else {
        const { data, error } = await supabase
          .from('finance_summaries')
          .insert({
            target_month: selectedMonthStr,
            previous_balance: 0,
            is_dues_visible: true
          })
          .select()
          .single()
        
        if (error) throw error
        if (data) setSummary(data)
      }
    } catch (err) {
      console.error(err)
      alert('공개 설정을 변경하는 중 오류가 발생했습니다.')
    }
  }

  const updateDuesStatus = async (id: string | null, userId: string, newStatus: string) => {
    if (id) {
      await supabase.from('dues').update({ status: newStatus }).eq('id', id)
    } else {
      await supabase.from('dues').insert({ user_id: userId, target_month: selectedMonthStr, status: newStatus, amount: 10000 })
    }
    fetchData()
  }

  // 이체 내역 매칭용 상태
  const [pastedText, setPastedText] = useState('')
  const [matchResults, setMatchResults] = useState<{ userId: string; nickname: string; matchedLine: string }[] | null>(null)
  const [selectedMatches, setSelectedMatches] = useState<Record<string, boolean>>({})
  
  // 회비 테이블 검색/페이지 상태
  const [duesSearchTerm, setDuesSearchTerm] = useState('')
  const [duesPage, setDuesPage] = useState(1)
  const DUES_PER_PAGE = 15

  // 닉네임에서 이름만 추출 (예: '홍길동/99/여' -> '홍길동', '🏃 김보민/95/여' -> '김보민')
  const extractName = (nickname: string): string => {
    // 이모티콘 제거
    const cleaned = nickname.replace(/[\u{1F3C3}\u{1F45F}\u{1F4AA}\u{200D}\u{2640}\u{2642}\u{FE0F}]/gu, '').trim()
    // 슬래시 앞의 이름 부분 추출
    const slashIdx = cleaned.indexOf('/')
    return slashIdx > 0 ? cleaned.substring(0, slashIdx).trim() : cleaned.trim()
  }

  // 입금 내역 매칭 분석 함수
  const runMatchCheck = (rawText: string) => {
    if (!rawText.trim()) return alert('이체 내역 텍스트를 입력하거나 CSV/엑셀 파일을 업로드해주세요.')
    
    const lines = rawText.split(/\r?\n/).filter(l => l.trim())
    const results: { userId: string; nickname: string; matchedLine: string }[] = []
    
    // 이미 입금완료(PAID)거나 면제 대상인 회원은 매칭 제외
    const checkableProfiles = profiles.filter(p => {
      const isExempt = isDuesExemptRole(p.role)
      const dues = duesList.find(d => d.user_id === p.id)
      return !isExempt && dues?.status !== 'PAID'
    })
    
    checkableProfiles.forEach(p => {
      const nick = p.nickname.trim()
      if (!nick) return
      
      // 이름 부분만 추출하여 매칭 (은행 이체내역에는 이름만 나오므로)
      const nameOnly = extractName(nick)
      if (!nameOnly || nameOnly.length < 2) return
      
      const matchedLine = lines.find(line => {
        const cleanLine = line.replace(/\s+/g, '').toLowerCase()
        return cleanLine.includes(nameOnly.toLowerCase())
      })

      if (matchedLine) {
        results.push({
          userId: p.id,
          nickname: p.nickname,
          matchedLine: matchedLine.trim()
        })
      }
    })
    
    if (results.length === 0) {
      alert('매칭되는 회원을 찾지 못했습니다. 이체 내역 내용이나 닉네임을 확인해주세요.')
    }
    
    setMatchResults(results)
    
    // 기본적으로 모두 선택
    const initialSelect: Record<string, boolean> = {}
    results.forEach(r => {
      initialSelect[r.userId] = true
    })
    setSelectedMatches(initialSelect)
  }

  // 엑셀/CSV/TXT/이미지 파일 업로드 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    
    if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      // 이미지 파일: Tesseract.js OCR 인식
      setIsLoading(true)
      setOcrProgress('이미지 분석 시작 중...')
      Tesseract.recognize(
        file,
        'kor+eng',
        {
          logger: m => {
            if (m.status === 'recognizing') {
              setOcrProgress(`이미지 글자 분석 중: ${Math.round(m.progress * 100)}%`)
            }
          }
        }
      ).then(({ data: { text } }) => {
        setPastedText(text)
        runMatchCheck(text)
      }).catch(err => {
        console.error('OCR Error:', err)
        alert('이미지 글자 분석 중 오류가 발생했습니다.')
      }).finally(() => {
        setIsLoading(false)
        setOcrProgress(null)
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      // 엑셀 파일: SheetJS로 파싱
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const csvText = XLSX.utils.sheet_to_csv(firstSheet)
          setPastedText(csvText)
          runMatchCheck(csvText)
        } catch (err) {
          console.error('Excel parse error:', err)
          alert('엑셀 파일 파싱 중 오류가 발생했습니다.')
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      // CSV/TXT 파일: EUC-KR 인코딩 (한국 은행 표준)
      const reader = new FileReader()
      reader.onload = (evt) => {
        const text = evt.target?.result as string
        setPastedText(text)
        runMatchCheck(text)
      }
      reader.readAsText(file, 'EUC-KR')
    }
  }



  // 매칭된 내역 일괄 납부 승인 처리
  const handleBatchApproveDues = async (selectedUserIds: string[]) => {
    if (selectedUserIds.length === 0) return alert('선택된 회원이 없습니다.')
    
    if (!confirm(`선택한 ${selectedUserIds.length}명의 회원을 '입금 완료' 상태로 일괄 변경하시겠습니까?`)) return
    
    setIsLoading(true)
    try {
      const promises = selectedUserIds.map(async (uid) => {
        const existingDues = duesList.find(d => d.user_id === uid)
        if (existingDues) {
          return supabase.from('dues').update({ status: 'PAID' }).eq('id', existingDues.id)
        } else {
          return supabase.from('dues').insert({ 
            user_id: uid, 
            target_month: selectedMonthStr, 
            status: 'PAID', 
            amount: 10000 
          })
        }
      })
      
      await Promise.all(promises)
      alert(`${selectedUserIds.length}명의 회비 납부 승인이 완료되었습니다.`)
      setMatchResults(null)
      setPastedText('')
      fetchData()
    } catch (err) {
      console.error('Batch dues update error:', err)
      alert('일괄 승인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 회원 탈퇴/강퇴 처리 (재무 탭에서 직접 처리 가능하도록)
  const handleKickMember = async (id: string, nickname: string) => {
    if (!confirm(`정말 ${nickname} 회원을 탈퇴/강퇴 처리하여 목록에서 삭제하시겠습니까?\n(데이터는 보존되며 로그인/회비 목록에서 즉시 삭제됩니다.)`)) return
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      alert(`${nickname} 회원이 정상적으로 강퇴 처리되었습니다.`)
      // Refresh database records
      window.location.reload()
    } catch (err: any) {
      console.error('Failed to kick member:', err)
      alert('강퇴 처리 중 오류가 발생했습니다: ' + (err.message || JSON.stringify(err)))
    } finally {
      setIsLoading(false)
    }
  }

  const updateExpenseStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('expenses').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Update expense status error:', err)
      alert('지출 상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Delete expense error:', err)
      alert('지출 정산 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 조회 연월 선택 드롭다운 */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-gray-900">📅 조회 월 선택</h2>
          <p className="text-[10px] text-gray-500 mt-0.5">선택한 월의 회비 현황과 지출 정산 데이터를 조회/수정합니다.</p>
        </div>
        <select
          value={selectedMonthStr}
          onChange={(e) => {
            setSelectedMonthStr(e.target.value)
            setDuesPage(1)
          }}
          className="bg-gray-55 border border-gray-200 rounded-2xl px-4 py-2 text-xs font-bold text-gray-900 h-10 outline-none focus:border-gray-400 cursor-pointer"
        >
          {monthOptions.map(m => {
            const [y, mm] = m.split('-')
            return (
              <option key={m} value={m}>
                {y}년 {parseInt(mm, 10)}월
              </option>
            )
          })}
        </select>
      </div>

      {/* 서브 탭 네비게이션 */}
      <div className="flex gap-2 border-b border-gray-100 pb-4">
        {[
          { id: 'SUMMARY', label: '📊 재무 요약표' },
          { id: 'DUES', label: '📥 회비 관리' },
          { id: 'EXPENSES', label: '💸 지출 정산' },
          { id: 'GOODS', label: '🎁 굿즈 신청' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-[#CCFF00] border border-[#b8e600] text-gray-900' 
                : 'bg-gray-55 border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center text-gray-500 text-xs font-bold py-2 bg-gray-50 rounded-2xl border border-gray-150 animate-pulse">{ocrProgress || '로딩 중...'}</div>}

      {/* 탭 1: 재무 요약표 (엑셀 형태) */}
      {!isLoading && activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <h2 className="text-gray-900 font-bold text-base mb-4 text-center border-b border-gray-100 pb-4">SRC {selectedMonthStr} 재무 현황표</h2>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* 지출 리스트 (엑셀 왼쪽) */}
              <div className="flex-1 w-full border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-gray-900 border-collapse">
                  <thead className="bg-gray-50 text-gray-950 font-bold border-b border-gray-150">
                    <tr>
                      <th className="py-3 px-3 text-left w-24 whitespace-nowrap">구분</th>
                      <th className="py-3 px-3 text-left">일자 / 내용</th>
                      <th className="py-3 px-3 text-right w-24 whitespace-nowrap">금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expensesList.filter(e => e.status === 'APPROVED').map((e, i) => (
                      <tr key={e.id} className={i % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}>
                        <td className="py-3 px-3 border-r border-gray-100 whitespace-nowrap">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap text-[10px] border border-gray-200">{e.category}</span>
                        </td>
                        <td className="py-3 px-3 border-r border-gray-100 text-gray-700 min-w-0 break-all leading-normal">
                          <span className="font-semibold text-gray-450 mr-2">{String(e.expense_date).substring(0, 10)}</span>
                          <span>{e.description}</span>
                        </td>
                        <td className="py-3 px-3 text-right text-red-650 font-bold whitespace-nowrap">-{e.amount.toLocaleString()}원</td>
                      </tr>
                    ))}
                    {expensesList.filter(e => e.status === 'APPROVED').length === 0 && (
                      <tr><td colSpan={3} className="py-8 text-center text-gray-400">지출 내역이 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
 
              {/* 요약 (엑셀 오른쪽) */}
              <div className="w-full md:w-64 space-y-4 shrink-0">
                <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-xs text-gray-900 border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-150">
                        <td className="p-3 bg-gray-50 font-bold text-center border-r border-gray-150 w-24 shrink-0">지출 계</td>
                        <td className="p-3 text-right text-red-650 font-bold">-{totalExpense.toLocaleString()}원</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-gray-50 font-bold text-center border-r border-gray-150 w-24 shrink-0">수입 계</td>
                        <td className="p-3 text-right text-blue-650 font-bold">+{totalIncome.toLocaleString()}원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
 
                {(() => {
                  const canViewBalance = isAdmin || summary?.is_balance_visible === true
                  return (
                    <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-white">
                      <table className="w-full text-xs text-gray-900 border-collapse">
                        <tbody>
                          <tr className="border-b border-gray-150">
                            <td className="p-3 bg-gray-50 font-bold text-center whitespace-nowrap border-r border-gray-150 w-24 shrink-0">
                              <div className="flex items-center justify-center gap-1">
                                <span>전월 잔고</span>
                                {isAdmin && (
                                  <button onClick={() => {setTempPrevBalance(prevBalance.toString()); setIsEditingPrevBalance(true)}} className="text-[9px] text-gray-500 hover:text-gray-900 underline border border-gray-200 px-1.5 py-0.5 rounded-full hover:bg-gray-100 transition-all font-medium">수정</button>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right font-bold">
                              {!canViewBalance ? (
                                <span className="text-gray-400 font-normal">비공개 🔒</span>
                              ) : isEditingPrevBalance ? (
                                <div className="flex gap-1 justify-end">
                                  <input type="number" value={tempPrevBalance} onChange={e => setTempPrevBalance(e.target.value)} className="w-20 border rounded-xl px-2 py-0.5 text-gray-900 focus:outline-none" />
                                  <button onClick={handleUpdatePrevBalance} className="bg-[#CCFF00] border border-[#b8e600] text-gray-900 px-2 py-0.5 rounded-xl font-bold">확인</button>
                                </div>
                              ) : (
                                `₩${prevBalance.toLocaleString()}`
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 bg-gray-50 font-bold text-center whitespace-nowrap border-r border-gray-150 w-24 shrink-0">현재 잔고</td>
                            <td className="p-3 text-right font-bold text-sm text-gray-950">
                              {!canViewBalance ? (
                                <span className="text-gray-400 font-normal">비공개 🔒</span>
                              ) : (
                                `₩${currentBalance.toLocaleString()}`
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* 지출 내역 및 잔고 공개 여부 토글 (크루장만 조작 가능) */}
          {isOwner && (
            <div className="bg-white p-5 rounded-2xl border border-gray-150 flex flex-col gap-4 shadow-sm">
              {/* 지출 내역 공개 여부 */}
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-900">지출 내역 회원 공개</h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      summary?.is_expenses_visible 
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-650' 
                        : 'bg-gray-100 border border-gray-200 text-gray-500'
                    }`}>
                      {summary?.is_expenses_visible ? '공개 중 🔓' : '비공개 🔒'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal">활성화 시 영수증과 함께 이번 달 지출 명세가 회원들에게 공개됩니다.</p>
                </div>
                <button
                  onClick={handleToggleExpensesVisible}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: summary?.is_expenses_visible ? '#CCFF00' : '#ebedf0',
                    boxShadow: summary?.is_expenses_visible ? '0 0 8px rgba(204,255,0,0.3)' : 'none'
                  }}
                  aria-label="지출 내역 회원 공개 여부 토글"
                >
                  <span
                    className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out"
                    style={{
                      transform: summary?.is_expenses_visible ? 'translateX(20px)' : 'translateX(0)',
                      backgroundColor: summary?.is_expenses_visible ? '#0a0a0b' : '#ffffff'
                    }}
                  />
                </button>
              </div>

              {/* 잔고 정보 회원 공개 여부 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-900">잔고 정보 회원 공개</h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      summary?.is_balance_visible 
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-650' 
                        : 'bg-gray-100 border border-gray-200 text-gray-500'
                    }`}>
                      {summary?.is_balance_visible ? '공개 중 🔓' : '비공개 🔒'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal">활성화 시 전월 이월금과 현재 통장 잔고가 회원들에게 노출됩니다.</p>
                </div>
                <button
                  onClick={handleToggleBalanceVisible}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: summary?.is_balance_visible ? '#CCFF00' : '#ebedf0',
                    boxShadow: summary?.is_balance_visible ? '0 0 8px rgba(204,255,0,0.3)' : 'none'
                  }}
                  aria-label="잔고 정보 회원 공개 여부 토글"
                >
                  <span
                    className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out"
                    style={{
                      transform: summary?.is_balance_visible ? 'translateX(20px)' : 'translateX(0)',
                      backgroundColor: summary?.is_balance_visible ? '#0a0a0b' : '#ffffff'
                    }}
                  />
                </button>
              </div>

              {/* 회비 납부 현황 회원 공개 여부 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-900">회비 현황 회원 공개</h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      summary?.is_dues_visible 
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-650' 
                        : 'bg-gray-100 border border-gray-200 text-gray-500'
                    }`}>
                      {summary?.is_dues_visible ? '공개 중 🔓' : '비공개 🔒'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal">활성화 시 이번 달 회원들의 개별 납부 현황 목록이 회원들에게 공개됩니다.</p>
                </div>
                <button
                  onClick={handleToggleDuesVisible}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: summary?.is_dues_visible ? '#CCFF00' : '#ebedf0',
                    boxShadow: summary?.is_dues_visible ? '0 0 8px rgba(204,255,0,0.3)' : 'none'
                  }}
                  aria-label="회비 납부 현황 회원 공개 여부 토글"
                >
                  <span
                    className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out"
                    style={{
                      transform: summary?.is_dues_visible ? 'translateX(20px)' : 'translateX(0)',
                      backgroundColor: summary?.is_dues_visible ? '#0a0a0b' : '#ffffff'
                    }}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 탭 2: 회비 관리 */}
      {!isLoading && activeTab === 'DUES' && (
        <div className="space-y-6">
          {/* 입금 내역 매칭 섹션 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-950">📥 이체 내역 매칭기 (엑셀 / 이미지 / 텍스트)</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  통장 거래 내역 파일(엑셀, CSV, TXT) 또는 입금 완료 화면 캡처 이미지(캡처본)를 올리거나 텍스트를 붙여넣어 회원을 자동으로 입금 처리합니다.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-500 mb-1">파일 업로드 (엑셀 / 이미지 / CSV / TXT)</label>
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-2xl file:border-0 file:text-[11px] file:font-bold file:bg-[#CCFF00] file:text-gray-900 hover:file:bg-[#b8e600] file:cursor-pointer bg-white border border-gray-200 rounded-2xl p-2.5" 
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-500 mb-1">내역 복사-붙여넣기 (직접 입력)</label>
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="예:&#13;06/10 12:30 홍길동 10,000&#13;06/10 13:45 이순신 10,000"
                  className="w-full h-24 bg-white border border-gray-200 rounded-2xl p-3 text-xs text-gray-900 focus:outline-none focus:border-gray-400 placeholder-gray-400 font-mono"
                />
              </div>
            </div>
            
            <div className="flex justify-end items-center pt-1 gap-2">
              {pastedText && (
                <button
                  onClick={() => { setPastedText(''); setMatchResults(null); }}
                  className="px-4 py-2 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
                >
                  초기화
                </button>
              )}
              <button
                onClick={() => runMatchCheck(pastedText)}
                className="px-4 py-2 rounded-2xl bg-[#CCFF00] border border-[#b8e600] text-gray-900 text-xs font-bold hover:bg-[#b8e600] transition-colors active:scale-95"
              >
                매칭 분석 실행
              </button>
            </div>

            {/* 매칭 분석 결과 표시 */}
            {matchResults && (
              <div className="border-t border-gray-150 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-emerald-650 flex items-center gap-1.5">
                    <span>💡</span> 매칭 결과: 총 {matchResults.length}건 검출됨
                  </h4>
                  <span className="text-[10px] text-gray-400">체크된 회원이 납부 처리됩니다.</span>
                </div>
                
                {matchResults.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-500">
                    일치하는 미납자 닉네임을 찾지 못했습니다.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {matchResults.map(r => (
                        <label key={r.userId} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all active:scale-[0.99]">
                          <input 
                            type="checkbox"
                            checked={!!selectedMatches[r.userId]}
                            onChange={e => setSelectedMatches(prev => ({ ...prev, [r.userId]: e.target.checked }))}
                            className="mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-[#CCFF00] bg-white h-4 w-4"
                          />
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-900">{r.nickname}</span>
                              <span className="text-[10px] text-gray-400">입금 대조 성공</span>
                            </div>
                            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-mono mt-1 break-all">{r.matchedLine}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setMatchResults(null)}
                        className="text-xs text-gray-500 hover:text-gray-950 underline"
                      >
                        닫기
                      </button>
                      <button
                        onClick={() => {
                          const selectedIds = Object.keys(selectedMatches).filter(id => selectedMatches[id])
                          handleBatchApproveDues(selectedIds)
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-[#CCFF00] border border-[#b8e600] text-gray-900 text-xs font-bold hover:bg-[#b8e600] transition-all shadow-sm active:scale-95"
                      >
                        선택한 {Object.values(selectedMatches).filter(Boolean).length}명 일괄 입금 승인
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 기존 회원 회비 관리 테이블 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* 검색 + 요약 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-gray-950">📋 월별 납부 현황</h3>
                {(() => {
                  const exemptCount = profiles.filter(p => isDuesExemptRole(p.role)).length
                  const payableCount = profiles.length - exemptCount
                  const paidCount = profiles.filter(p => {
                    if (isDuesExemptRole(p.role)) return false
                    const dues = duesList.find(d => d.user_id === p.id)
                    return dues?.status === 'PAID'
                  }).length
                  return (
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                        납부완료 {paidCount} / 대상 {payableCount}
                      </span>
                      <span className="text-[10px] bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full font-bold">
                        회비면제 {exemptCount}명
                      </span>
                    </div>
                  )
                })()}
              </div>
              <div className="relative max-w-[200px] w-full">
                <input
                  type="text"
                  placeholder="이름 검색..."
                  value={duesSearchTerm}
                  onChange={e => { setDuesSearchTerm(e.target.value); setDuesPage(1) }}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-950 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                />
                <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-150 text-gray-500">
                  <th className="pb-2 px-2">크루원</th>
                  <th className="pb-2 px-2">회비상태</th>
                  <th className="pb-2 px-2 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const isNewMemberThisMonth = (joinedAtStr: string) => {
                    if (!joinedAtStr) return false
                    const joinDate = new Date(joinedAtStr)
                    return currentDate.getFullYear() === joinDate.getFullYear() && 
                           currentDate.getMonth() === joinDate.getMonth()
                  }
                  
                  // 면제 대상 우선 정렬 후 가나다순 정렬
                  const sorted = [...profiles].sort((a, b) => {
                    const aExempt = isDuesExemptRole(a.role)
                    const bExempt = isDuesExemptRole(b.role)
                    if (aExempt && !bExempt) return -1
                    if (!aExempt && bExempt) return 1
                    return a.nickname.localeCompare(b.nickname, 'ko')
                  })
                  const filtered = sorted.filter(p => 
                    p.nickname.toLowerCase().includes(duesSearchTerm.toLowerCase())
                  )
                  
                  // 페이지네이션
                  const totalPages = Math.ceil(filtered.length / DUES_PER_PAGE)
                  const paged = filtered.slice((duesPage - 1) * DUES_PER_PAGE, duesPage * DUES_PER_PAGE)
                  
                  return (
                    <>
                      {paged.map(p => {
                        const dues = duesList.find(d => d.user_id === p.id)
                        const isExempted = isDuesExemptRole(p.role)
                        // 인증 면제는 당월 가입 회원 또는 관리자가 직접 면제 지정한 회원만 적용
                        const s = calculateSurvival(records.filter(r => r.user_id === p.id), isRunningExempt(p))
                        const needsRefund = dues?.status === 'PAID' && !s.isSurvived && !isExempted
                        
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-2.5 px-2 font-bold text-gray-900">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span>{p.nickname}</span>
                                {isExempted && (
                                  <span className="bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded text-[8px] font-bold border border-emerald-100">
                                    회비면제
                                  </span>
                                )}
                                {isRunningExempt(p) && (
                                  <span className="bg-sky-50 text-sky-600 px-1 py-0.5 rounded text-[8px] font-bold border border-sky-200">
                                    인증면제{isJoinedThisMonth(p.created_at) ? '(신규)' : ''}
                                  </span>
                                )}
                                {needsRefund && (
                                  <span className="bg-red-50 text-red-600 px-1 py-0.5 rounded text-[8px] font-bold border border-red-200">
                                    환불요망
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2">
                              {isExempted ? (
                                <span className="text-emerald-600 font-bold text-[10px]">—</span>
                              ) : !dues || dues.status === 'UNPAID' ? (
                                <span className="text-red-500 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full text-[10px]">미납</span>
                              ) : dues.status === 'PENDING' ? (
                                <span className="text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full text-[10px]">승인대기</span>
                              ) : dues.status === 'PAID' ? (
                                <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">✓ 납부완료</span>
                              ) : (
                                <span className="text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full text-[10px]">환불됨</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              {isExempted ? (
                                <span className="text-gray-300 text-[10px]">면제</span>
                              ) : (
                                <div className="flex gap-1.5 justify-end">
                                  {(!dues || dues.status === 'UNPAID' || dues.status === 'PENDING') && (
                                    <>
                                      <button onClick={() => updateDuesStatus(dues?.id || null, p.id, 'PAID')} className="bg-[#CCFF00] hover:bg-[#b8e600] border border-[#b8e600] text-gray-900 px-2 py-1 rounded-xl text-[10px] font-bold transition-all active:scale-95">납부처리</button>
                                      <button onClick={() => handleKickMember(p.id, p.nickname)} className="bg-white hover:bg-red-50 border border-red-200 text-red-650 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all active:scale-95">강퇴/삭제</button>
                                    </>
                                  )}
                                  {dues?.status === 'PAID' && (
                                    <button onClick={() => updateDuesStatus(dues.id, p.id, 'UNPAID')} className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 px-2 py-1 rounded-xl text-[10px] font-bold transition-all active:scale-95">취소</button>
                                  )}
                                  {(needsRefund || dues?.status === 'PAID') && (
                                    <button onClick={() => updateDuesStatus(dues!.id, p.id, 'REFUNDED')} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-2 py-1 rounded-xl text-[10px] font-bold transition-all active:scale-95">환불</button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {paged.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-gray-400">검색 결과가 없습니다.</td></tr>
                      )}
                    </>
                  )
                })()}
              </tbody>
            </table>
            </div>

            {/* 페이지네이션 */}
            {(() => {
              const sorted = [...profiles].sort((a, b) => a.nickname.localeCompare(b.nickname, 'ko'))
              const filtered = sorted.filter(p => p.nickname.toLowerCase().includes(duesSearchTerm.toLowerCase()))
              const totalPages = Math.ceil(filtered.length / DUES_PER_PAGE)
              if (totalPages <= 1) return null
              return (
                <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-gray-100 mt-4">
                  <button
                    onClick={() => setDuesPage(p => Math.max(1, p - 1))}
                    disabled={duesPage === 1}
                    className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setDuesPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        duesPage === page
                          ? 'bg-[#CCFF00] border border-[#b8e600] text-gray-900'
                          : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >{page}</button>
                  ))}
                  <button
                    onClick={() => setDuesPage(p => Math.min(totalPages, p + 1))}
                    disabled={duesPage === totalPages}
                    className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >→</button>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* 탭 3: 지출 청구 내역 */}
      {!isLoading && activeTab === 'EXPENSES' && (
        <div className="space-y-6">
          {/* 1. 지출 승인 대기 목록 (신청한 사람 회원승인명단처럼 딱 보이게) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-950">지출 승인 대기</h2>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
                  {expensesList.filter(e => e.status === 'PENDING').length}건
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">송금 완료 후 승인을 눌러주세요.</span>
            </div>

            {expensesList.filter(e => e.status === 'PENDING').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 text-xs">
                <p>대기 중인 지출 청구 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-150">
                {expensesList.filter(e => e.status === 'PENDING').map((e: any) => (
                  <div key={e.id} className="flex flex-col md:flex-row md:items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                    
                    {/* 왼쪽: 영수증 썸네일 & 청구 정보 */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {e.receipt_image_url && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shrink-0">
                          <img
                            src={e.receipt_image_url}
                            alt="영수증"
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => setActiveReceiptUrl(e.receipt_image_url)}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900">{e.claimant_name || e.profiles?.nickname || '신청자'}</span>
                          {e.claimant_phone && (
                            <span className="text-xs text-gray-500">({e.claimant_phone})</span>
                          )}
                          <span className="text-[10px] font-bold bg-gray-100 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                            {e.category}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-900 font-medium">
                          {e.description}
                        </p>
                        
                        <p className="text-[10px] text-gray-400">
                          지출일: {e.expense_date}
                        </p>
                        
                        {/* 계좌 정보 복사하기 */}
                        <div className="mt-1 bg-gray-50 border border-gray-200 rounded-xl p-2 font-mono text-[11px] text-gray-800 flex items-center justify-between max-w-sm">
                          <span className="truncate mr-2">{e.bank_account}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(e.bank_account)
                              alert('계좌 정보가 복사되었습니다.')
                            }}
                            className="text-[10px] text-blue-600 hover:underline border border-blue-200 bg-blue-50 px-2 py-0.5 rounded-lg font-bold shrink-0"
                          >
                            복사
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽: 금액 & 승인/반려 액션 */}
                    <div className="flex items-center justify-between md:justify-end gap-4 md:w-48 shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">청구 금액</span>
                        <span className="text-sm font-bold text-red-600">
                          -{e.amount.toLocaleString()}원
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateExpenseStatus(e.id, 'APPROVED')}
                          className="rounded-xl bg-[#CCFF00] border border-[#b8e600] px-3.5 py-2 text-xs font-bold text-gray-900 transition-all active:scale-95"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => updateExpenseStatus(e.id, 'REJECTED')}
                          className="rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-650 px-3.5 py-2 text-xs font-bold transition-all active:scale-95"
                        >
                          반려
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. 지난 정산 내역 아카이브 (처리 완료 내역) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-950">정산 처리 완료 내역</h2>
              <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
                {expensesList.filter(e => e.status !== 'PENDING').length}건
              </span>
            </div>

            {expensesList.filter(e => e.status !== 'PENDING').length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                처리 완료된 내역이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap font-sans">
                  <thead>
                    <tr className="border-b border-gray-150 text-gray-500">
                      <th className="pb-2 px-2">일자/구분</th>
                      <th className="pb-2 px-2">청구자</th>
                      <th className="pb-2 px-2">내용</th>
                      <th className="pb-2 px-2 text-right">금액</th>
                      <th className="pb-2 px-2 text-center">결과</th>
                      <th className="pb-2 px-2 text-right">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expensesList.filter(e => e.status !== 'PENDING').map((e: any) => (
                      <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500 font-medium">{String(e.expense_date).substring(0, 10)}</span>
                            <span className="bg-gray-100 border border-gray-200 text-gray-650 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap">
                              {e.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-bold text-gray-900">
                          {e.claimant_name || e.profiles?.nickname || '신청자'}
                        </td>
                        <td className="py-3 px-2 text-gray-700 truncate max-w-[150px]">{e.description}</td>
                        <td className="py-3 px-2 text-right text-red-600 font-bold">
                          -{e.amount.toLocaleString()}원
                        </td>
                        <td className="py-3 px-2 text-center">
                          {e.status === 'APPROVED' ? (
                            <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                              정산 완료
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full text-[10px]">
                              반려됨
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => deleteExpense(e.id)}
                            className="text-[11px] text-gray-400 hover:text-red-650 underline font-medium"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 탭 4: 굿즈 신청 내역 및 재고 */}
      {!isLoading && activeTab === 'GOODS' && (
        <div className="space-y-6">
          {/* 재고 관리 패널 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <h2 className="text-gray-900 font-bold text-base mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
              <span>📦 SRC 티셔츠 실시간 재고 관리</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['블랙', '화이트'].map(color => (
                <div key={color} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h3 className="font-bold text-sm text-gray-900 mb-3">{color}</h3>
                  <div className="space-y-2">
                    {['S', 'M', 'L', 'XL'].map(size => {
                      const inv = inventoryList.find(i => i.goods_type === 'TSHIRT' && i.color === color && i.size === size)
                      const stock = inv?.stock || 0
                      return (
                        <div key={size} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200">
                          <span className="text-xs font-bold w-12">{size}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-500">재고: <span className={stock > 0 ? 'text-blue-600' : 'text-red-500'}>{stock}</span>개</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleUpdateInventory(inv?.id || null, 'TSHIRT', color, size, stock, -1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200">-</button>
                              <button onClick={() => handleUpdateInventory(inv?.id || null, 'TSHIRT', color, size, stock, 1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200">+</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3">* 위 +/- 버튼을 눌러 관리자가 직접 입고 처리를 할 수 있습니다. 크루원이 구매하면 자동으로 차감됩니다.</p>
          </div>

          {/* 굿즈 신청 내역 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <h2 className="text-gray-900 font-bold text-base mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
              <span>🎁 SRC 굿즈 신청 내역</span>
              <span className="text-xs bg-[#CCFF00] px-3 py-1 rounded-full text-gray-900">
                총 {goodsList.length}건
              </span>
            </h2>
            
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                  <tr>
                    <th className="p-3 w-12">No</th>
                    <th className="p-3 w-28">신청일</th>
                    <th className="p-3 w-32">신청자</th>
                    <th className="p-3">신청 옵션</th>
                    <th className="p-3 w-24">결제금액</th>
                    <th className="p-3 w-20">입금확인</th>
                    <th className="p-3 w-24">상태</th>
                    <th className="p-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {goodsList.map((g, idx) => (
                    <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 text-gray-400 font-medium">{goodsList.length - idx}</td>
                      <td className="p-3 text-gray-700 font-medium">{String(g.created_at).substring(5, 16).replace('T', ' ')}</td>
                      <td className="p-3 font-bold text-gray-900">
                        {g.details?.buyerInfo || g.profiles?.nickname || '알 수 없음'}
                      </td>
                      <td className="p-3 text-gray-700">
                        {g.details?.items ? (
                          <div className="flex flex-wrap gap-1">
                            {g.details.items.map((item: any, i: number) => (
                              <span key={i} className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {item.color} {item.size} ({item.count}장)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="font-bold">{g.goods_type === 'TSHIRT' ? '티셔츠 👕' : '러닝양말 🧦'} ({g.size})</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-900 font-bold">
                        {g.details?.totalPrice ? `${g.details.totalPrice.toLocaleString()}원` : '-'}
                      </td>
                      <td className="p-3">
                        {g.details?.isPaid ? (
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">입금완료</span>
                        ) : g.details?.isPaid === false ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">미입금</span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {g.status === 'COMPLETED' ? (
                          <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold border border-blue-100">
                            지급완료
                          </span>
                        ) : g.status === 'CANCELED' ? (
                          <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-bold border border-gray-200">
                            취소됨
                          </span>
                        ) : (
                          <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-bold border border-orange-100 animate-pulse">
                            대기중
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {isAdmin && g.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateGoodsStatus(g.id, 'COMPLETED')}
                              className="px-3 py-1.5 bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 rounded-lg font-bold transition-all active:scale-95 border border-[#b8e600]"
                            >
                              지급완료
                            </button>
                            <button
                              onClick={() => {
                                if(confirm('이 신청을 취소 처리할까요?')) {
                                  handleUpdateGoodsStatus(g.id, 'CANCELED')
                                }
                              }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold transition-all active:scale-95 border border-gray-200"
                            >
                              취소
                            </button>
                          </>
                        )}
                        {isAdmin && g.status !== 'PENDING' && (
                          <button
                            onClick={() => handleUpdateGoodsStatus(g.id, 'PENDING')}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg font-bold transition-all active:scale-95 border border-gray-200"
                          >
                            대기전환
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {goodsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                        접수된 굿즈 신청이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 영수증 보기 팝업 모달 */}
      {activeReceiptUrl && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in duration-200"
          onClick={() => setActiveReceiptUrl(null)}
        >
          <div className="relative max-w-full max-h-[85vh] overflow-auto rounded-2xl" onClick={e => e.stopPropagation()}>
            <img
              src={activeReceiptUrl}
              alt="Receipt"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
          
          <button
            onClick={() => setActiveReceiptUrl(null)}
            className="mt-6 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs px-5 py-3 rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            닫기
          </button>
        </div>
      )}
    </div>
  )
}

