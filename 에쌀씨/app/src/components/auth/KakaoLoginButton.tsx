'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function KakaoLoginButton() {
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      // Force absolute URL and ensure no 0.0.0.0
      let origin = window.location.origin;
      if (origin.includes('0.0.0.0')) {
        origin = origin.replace('0.0.0.0', 'localhost');
      }
      
      const callbackUrl = new URL('/auth/callback', origin).href;
      
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (oauthError) {
        setError(`OAuth 에러: ${oauthError.message}`)
        setLoading(false)
        return
      }

      if (!data?.url) {
        setError('리다이렉트 URL을 받지 못했습니다.')
        setLoading(false)
        return
      }

      // 정상이면 여기서 리다이렉트됨
    } catch (err: any) {
      setError(`예외 발생: ${err?.message || JSON.stringify(err)}`)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      {error && (
        <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 break-all">
          🚨 {error}
        </div>
      )}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="
          flex items-center justify-center gap-3
          w-full px-6 py-3.5
          bg-[#FEE500] hover:bg-[#F5DC00]
          text-[#191919] font-semibold text-[15px]
          rounded-xl
          transition-all duration-200 ease-in-out
          shadow-md hover:shadow-lg active:scale-[0.98]
          disabled:opacity-60
        "
      >
        {/* 카카오 로고 SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2C5.58172 2 2 4.79086 2 8.22222C2 10.3507 3.33333 12.2222 5.41667 13.3704L4.58333 16.5L8.08333 14.3333C8.70833 14.4444 9.35417 14.5 10 14.5C14.4183 14.5 18 11.6542 18 8.22222C18 4.79086 14.4183 2 10 2Z"
            fill="#191919"
          />
        </svg>
        {loading ? '로그인 중...' : '카카오 계정으로 시작하기'}
      </button>
    </div>
  )
}
