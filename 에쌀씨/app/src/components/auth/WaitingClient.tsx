'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function WaitingClient({
  userId,
  initialPhone,
  nickname,
}: {
  userId: string
  initialPhone: string | null
  nickname: string
}) {
  const supabase = createClient() as any
  const router = useRouter()

  const [phone, setPhone] = useState(initialPhone ?? '')
  const [name, setName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState('남')
  
  const [saved, setSaved] = useState(!!initialPhone && nickname.includes('/')) // if it includes slash, it's likely setup
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 전화번호 포맷팅 (010-1234-5678)
  const formatPhone = (value: string) => {
    const nums = value.replace(/[^0-9]/g, '').slice(0, 11)
    if (nums.length <= 3) return nums
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
    setSaved(false)
  }

  const handleSavePhone = async () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    const yearNum = parseInt(birthYear, 10)
    const currentYear = new Date().getFullYear()
    const maxYear = currentYear - 19 // 성인 (만 19세 기준)

    if (isNaN(yearNum) || birthYear.length !== 4) {
      setError('태어난 연도 4자리를 정확히 입력해주세요 (예: 1990)')
      return
    }

    if (yearNum < 1975 || yearNum > maxYear) {
      setError(`가입 가능 연령이 아닙니다. (1975년생 ~ ${maxYear}년생까지 가입 가능)`)
      return
    }

    const rawPhone = phone.replace(/-/g, '')
    if (rawPhone.length < 10 || rawPhone.length > 11) {
      setError('올바른 연락처를 입력해주세요.')
      return
    }

    setSaving(true)
    setError(null)

    // 이름/생년(2자리)/성별 포맷으로 닉네임 생성
    const shortYear = birthYear.slice(-2)
    const formattedNickname = `${name.trim()}/${shortYear}/${gender}`

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          phone: rawPhone,
          nickname: formattedNickname
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setSaved(true)
    } catch (err: any) {
      setError(err?.message || '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // 주기적으로 승인 여부 확인 (30초마다)
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', userId)
        .single()

      if (profile && profile.role !== 'WAITING' && profile.is_active) {
        router.push('/dashboard')
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [userId, supabase, router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center gap-6 text-center w-full max-w-sm">
        {/* 아이콘 및 제목 */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-2xl font-extrabold text-gray-900">승인 대기 중</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            <span className="text-gray-900 font-bold">{nickname}</span>님, 가입 신청이 완료되었습니다.
            <br />
            운영자 승인 후 서비스를 이용하실 수 있습니다.
          </p>
        </div>

        {/* 정보 입력 카드 */}
        <div className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-bold text-gray-900">가입 정보 등록</h2>
            {saved && (
              <span className="ml-auto text-[10px] font-bold text-gray-900 bg-[#CCFF00] border border-[#b8e600] rounded-full px-2 py-0.5">
                제출 완료
              </span>
            )}
          </div>

          {!saved ? (
            <>
              <p className="text-xs text-gray-500 leading-relaxed text-left">
                정확한 가입 승인을 위해 이름과 출생연도, 성별, 연락처를 입력해 주세요. (가입 가능: 1975년생 ~ 성인)
              </p>
              
              <div className="space-y-3">
                {/* 이름 */}
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />

                {/* 출생연도 + 성별 (두 개는 한 줄에) */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="출생연도 (예: 1990)"
                    className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-20 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                  >
                    <option value="남">남</option>
                    <option value="여">여</option>
                  </select>
                </div>
                
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="연락처 (010-0000-0000)"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />

                <button
                  onClick={handleSavePhone}
                  disabled={saving || !phone || !name || !birthYear}
                  className="w-full rounded-2xl px-4 py-3 bg-[#CCFF00] border border-[#b8e600] text-sm font-bold text-gray-900 hover:bg-[#b8e600] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-75 active:scale-[0.98]"
                >
                  {saving ? '저장 중...' : '가입 정보 제출'}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-600 font-bold mt-2">{error}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-900 leading-relaxed font-bold">
              정보가 성공적으로 제출되었습니다. <br/>운영자의 승인을 기다려주세요!
            </p>
          )}
        </div>

        {/* 안내 */}
        <p className="text-xs text-gray-500 leading-relaxed">
          승인이 완료되면 자동으로 이동됩니다.
          <br />
          승인 문의는 운영진에게 연락해 주세요.
        </p>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-4"
        >
          다른 계정으로 로그인
        </button>
      </div>
    </main>
  )
}
