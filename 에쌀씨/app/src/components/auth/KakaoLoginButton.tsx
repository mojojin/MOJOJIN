'use client'

import { createClient } from '@/lib/supabase/client'

export default function KakaoLoginButton() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // 카카오 동의 항목: 닉네임, 프로필 이미지
        queryParams: {
          scope: 'profile_nickname profile_image',
        },
      },
    })
  }

  return (
    <button
      onClick={handleLogin}
      className="
        flex items-center justify-center gap-3
        w-full max-w-sm px-6 py-3.5
        bg-[#FEE500] hover:bg-[#F5DC00]
        text-[#191919] font-semibold text-[15px]
        rounded-xl
        transition-all duration-200 ease-in-out
        shadow-md hover:shadow-lg active:scale-[0.98]
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
      카카오 계정으로 시작하기
    </button>
  )
}
