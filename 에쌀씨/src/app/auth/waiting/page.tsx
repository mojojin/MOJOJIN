export default function WaitingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="text-5xl">⏳</div>
        <h1 className="text-2xl font-bold text-white">
          승인 대기 중
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          가입 신청이 완료되었습니다.
          <br />
          운영자 승인 후 서비스를 이용하실 수 있습니다.
          <br />
          <span className="text-gray-500">승인 문의는 운영자에게 연락해 주세요.</span>
        </p>
      </div>
    </main>
  )
}
