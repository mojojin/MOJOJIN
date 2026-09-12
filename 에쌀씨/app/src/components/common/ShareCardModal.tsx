'use client'

import React, { useState, useRef, useEffect } from 'react'

interface ShareCardModalProps {
  isOpen: boolean
  onClose: () => void
  initialRecord?: {
    distance?: number | string
    pace?: string
    runDate?: string
    durationMinutes?: number | string
    recordType?: string
  }
  userNickname: string
}

export default function ShareCardModal({
  isOpen,
  onClose,
  initialRecord,
  userNickname
}: ShareCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [theme, setTheme] = useState<'NEON' | 'DARK' | 'MINIMAL'>('NEON')
  
  // 개인정보 보호: 닉네임에서 이름/88/남 중 이름만 추출 (예: '박병진/88/남' -> '박병진')
  const pureName = (userNickname || '').split('/')[0].trim()
  const [showNickname, setShowNickname] = useState(true)

  const [distance, setDistance] = useState(initialRecord?.distance ? String(initialRecord.distance) : '5.00')
  const [pace, setPace] = useState(initialRecord?.pace || "5'30\"")
  const [time, setTime] = useState(
    initialRecord?.durationMinutes ? `${initialRecord.durationMinutes}분` : '27:30'
  )
  const [runDate, setRunDate] = useState(
    initialRecord?.runDate || new Date().toISOString().split('T')[0]
  )

  // 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => setBgImage(img)
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // 나이키 러닝 클럽(NRC) 스타일 심플 캔버스 그리기
  const renderCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 1080x1350 (Instagram Story 4:5 고해상도 규격)
    canvas.width = 1080
    canvas.height = 1350

    // 1. 배경 처리
    if (bgImage) {
      const scale = Math.max(canvas.width / bgImage.width, canvas.height / bgImage.height)
      const x = (canvas.width - bgImage.width * scale) / 2
      const y = (canvas.height - bgImage.height * scale) / 2
      ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale)

      // 가독성을 위한 그라데이션 오버레이
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      if (theme === 'NEON') {
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)')
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)')
      } else if (theme === 'DARK') {
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.6)')
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)')
      } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.85)')
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      // 기본 배경 (스튜디오 스타일)
      if (theme === 'NEON') {
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        bgGrad.addColorStop(0, '#111827')
        bgGrad.addColorStop(1, '#030712')
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else if (theme === 'DARK') {
        ctx.fillStyle = '#090d16'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else {
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    // 테마별 폰트 컬러 설정
    const primaryColor = theme === 'MINIMAL' ? '#0f172a' : '#CCFF00' // SRC 시그니처 네온 옐로우
    const textColor = theme === 'MINIMAL' ? '#0f172a' : '#ffffff'
    const subTextColor = theme === 'MINIMAL' ? '#64748b' : '#94a3b8'

    // 2. 상단 브랜딩 헤더 (단일 심플 헤더)
    ctx.font = 'bold 36px sans-serif'
    ctx.fillStyle = primaryColor
    ctx.fillText('SUWON RUNNING CREW', 80, 120)

    // 3. 메인 거대 거리 수치 (NRC 수치 스타일)
    const distText = `${parseFloat(distance || '0').toFixed(2)}`
    
    // 거리 텍스트 폰트 설정 후 너비 측정 (겹침 버그 완벽 수정)
    ctx.font = '900 180px sans-serif'
    ctx.fillStyle = textColor
    ctx.fillText(distText, 80, 720)
    
    const distWidth = ctx.measureText(distText).width

    // KM 단위 배치 (숫자 뒤에 정확한 간격으로 배치)
    ctx.font = 'bold 54px sans-serif'
    ctx.fillStyle = primaryColor
    ctx.fillText('KM', 80 + distWidth + 24, 720)

    // 4. 하단 세로 구분선 및 나이키 스타일 메트릭스 블록
    const lineY = 820
    ctx.strokeStyle = theme === 'MINIMAL' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(80, lineY)
    ctx.lineTo(canvas.width - 80, lineY)
    ctx.stroke()

    // 하단 상세 수치 4컬럼배치
    const colY = lineY + 60
    const valY = lineY + 115

    // [컬럼 1: 페이스]
    ctx.font = 'bold 22px sans-serif'
    ctx.fillStyle = subTextColor
    ctx.fillText('PACE', 80, colY)
    ctx.font = 'bold 44px sans-serif'
    ctx.fillStyle = textColor
    ctx.fillText(pace || "0'00\"", 80, valY)

    // [컬럼 2: 시간]
    ctx.font = 'bold 22px sans-serif'
    ctx.fillStyle = subTextColor
    ctx.fillText('TIME', 340, colY)
    ctx.font = 'bold 44px sans-serif'
    ctx.fillStyle = textColor
    ctx.fillText(time || '00:00', 340, valY)

    // [컬럼 3: 날짜]
    ctx.font = 'bold 22px sans-serif'
    ctx.fillStyle = subTextColor
    ctx.fillText('DATE', 600, colY)
    ctx.font = 'bold 44px sans-serif'
    ctx.fillStyle = textColor
    ctx.fillText(runDate, 600, valY)

    // [컬럼 4: 러너 이름 (개인정보 보호 - 이름만 출력)]
    if (showNickname && pureName) {
      ctx.font = 'bold 22px sans-serif'
      ctx.fillStyle = subTextColor
      ctx.fillText('RUNNER', 860, colY)
      ctx.font = 'bold 40px sans-serif'
      ctx.fillStyle = primaryColor
      ctx.fillText(pureName, 860, valY)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(renderCanvas, 100)
    }
  }, [isOpen, bgImage, theme, distance, pace, time, runDate, pureName, showNickname])

  // 이미지 다운로드
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = image
    link.download = `SRC_RUN_${runDate}_${pureName || 'Runner'}.png`
    link.click()
  }

  // 모바일 웹 공유 API
  const handleShare = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `SRC_RUN_${runDate}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'SRC 러닝 인증',
            text: '수원러닝크루(SRC) 러닝 인증샷!'
          })
        } catch (err) {
          // 공유 취소 등
        }
      } else {
        handleDownload()
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl my-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📸 SRC 러닝 인증 카드 (NRC 스타일)</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* 캔버스 미리보기 */}
        <div className="relative aspect-[4/5] w-full bg-gray-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-800">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />
        </div>

        {/* 설정 컨트롤 */}
        <div className="space-y-3 text-xs">
          {/* 사진 선택 & 테마 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-500 font-bold mb-1">배경 사진 업로드</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">테마 스타일</label>
              <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200">
                <button
                  onClick={() => setTheme('NEON')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    theme === 'NEON' ? 'bg-gray-900 text-[#CCFF00] shadow-sm' : 'text-gray-500'
                  }`}
                >
                  네온
                </button>
                <button
                  onClick={() => setTheme('DARK')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    theme === 'DARK' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  다크
                </button>
                <button
                  onClick={() => setTheme('MINIMAL')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    theme === 'MINIMAL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  화이트
                </button>
              </div>
            </div>
          </div>

          {/* 개인정보 및 수치 설정 */}
          <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
            <span className="text-gray-700 font-bold text-xs">개인정보보호: 이름만 표시 ({pureName})</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showNickname}
                onChange={e => setShowNickname(e.target.checked)}
                className="rounded border-gray-300 text-gray-900 focus:ring-0"
              />
              <span className="text-xs text-gray-600 font-medium">이름 표시</span>
            </label>
          </div>

          {/* 수치 입력 */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-gray-500 font-bold mb-1">거리 (km)</label>
              <input
                type="text"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">페이스</label>
              <input
                type="text"
                value={pace}
                onChange={e => setPace(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-bold mb-1">운동시간</label>
              <input
                type="text"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>💾</span>
            <span>PNG 저장</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-[#CCFF00] hover:bg-[#b8e600] text-gray-950 font-extrabold text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>📲</span>
            <span>인스타/카톡 공유</span>
          </button>
        </div>
      </div>
    </div>
  )
}
