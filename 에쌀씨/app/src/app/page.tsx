import KakaoLoginButton from '@/components/auth/KakaoLoginButton'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const error = params?.error

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-6">
      {/* 로그인 실패 시 안내 메시지 */}
      {error && (
        <div className="mb-6 w-full max-w-sm rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
          로그인에 실패했습니다. 다시 시도해주세요.
        </div>
      )}

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
