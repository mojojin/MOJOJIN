import React from 'react'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            수원러닝크루 (SRC)
          </h1>
          <p className="text-lg text-gray-900 font-bold bg-[#CCFF00] inline-block px-3 py-1 rounded-2xl">
            "친목" 보다 "러닝"
          </p>
        </div>

        {/* Intro */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 space-y-4">
          <p className="text-gray-700 leading-relaxed font-medium">
            달리기를 즐기는 문화를 지향합니다.<br />
            다채로운 러닝을 통한 특별한 경험, 에쌀씨는 러너들과 함께합니다.
          </p>
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
              정기런
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
              훈련벙
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
              마라톤
            </div>
          </div>
        </div>

        {/* Regular Run Info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            정기런 안내
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="text-xs font-bold text-gray-500 mb-1">DISTANCE</div>
              <div className="text-lg font-extrabold text-gray-900">약 6km</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="text-xs font-bold text-gray-500 mb-1">PACE</div>
              <div className="text-lg font-extrabold text-gray-900">500 ~ 730 조율</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:col-span-2">
              <div className="text-xs font-bold text-gray-500 mb-1">INFO</div>
              <ul className="text-gray-700 text-sm space-y-2 font-medium">
                <li>• 준비물: 개인 컵, 땀 닦을 수건 (권장)</li>
                <li>• 우천 시에도 진행 (취소 시 미리 공지 예정)</li>
                <li>• 런린이도 언제나 환영합니다!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Guest Rules */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6 space-y-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            GUEST 안내
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            에쌀씨(SRC) 가입을 원하시는 분은 카카오톡 오픈채팅 <strong className="text-gray-900">"SRC GUEST ROOM"</strong>에 입장해주세요.<br />
            회칙 내 정회원 기준 충족 시에 정식 멤버로 승급됩니다.
          </p>
        </div>

      </div>
    </main>
  )
}
