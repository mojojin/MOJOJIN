import KakaoLoginButton from '@/components/auth/KakaoLoginButton'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-6">
      {/* 로고 / 타이틀 */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <div className="text-5xl">🏃</div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          수원러닝크루
        </h1>
        <p className="text-gray-400 text-sm text-center">
          SRC 멤버 전용 러닝 기록 플랫폼
        </p>
      </div>

      {/* 로그인 버튼 */}
      <KakaoLoginButton />

      <p className="mt-6 text-xs text-gray-600 text-center">
        카카오 계정으로 간편하게 로그인하세요
        <br />
        가입 후 운영자 승인이 필요합니다
      </p>
    </main>
  )
}
