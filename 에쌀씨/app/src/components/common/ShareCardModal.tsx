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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [theme, setTheme] = useState<'NEON' | 'DARK' | 'ORANGE' | 'MINIMAL'>('NEON')
  const [textPosition, setTextPosition] = useState<'BOTTOM' | 'TOP' | 'CENTER'>('BOTTOM')
  
  // 개인정보 보호: 닉네임에서 이름/88/남 중 이름만 추출 (예: '박병진/88/남' -> '박병진')
  const pureName = (userNickname || '').split('/')[0].trim()
  
  // 선택적 표시 항목 토글 (기본적으로 페이스/시간은 비활성화하여 빠른 작성 지원!)
  const [showNickname, setShowNickname] = useState(true)
  const [showRunDate, setShowRunDate] = useState(true)
  const [showPace, setShowPace] = useState(false)
  const [showTime, setShowTime] = useState(false)

  const [distance, setDistance] = useState('5.00')
  const [pace, setPace] = useState('')
  const [time, setTime] = useState('')
  const [runDate, setRunDate] = useState(new Date().toISOString().split('T')[0])

  const [logoNeon, setLogoNeon] = useState<HTMLImageElement | null>(null)
  const [logoBlue, setLogoBlue] = useState<HTMLImageElement | null>(null)

  // 로고 이미지 프리로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const neonImg = new Image()
      neonImg.src = '/images/logo_neon.png'
      neonImg.onload = () => setLogoNeon(neonImg)

      const blueImg = new Image()
      blueImg.src = '/images/logo_blue.png'
      blueImg.onload = () => setLogoBlue(blueImg)
    }
  }, [])

  // initialRecord 가 변경되거나 모달이 열릴 때 자동 데이터 입력
  useEffect(() => {
    if (isOpen) {
      if (initialRecord?.distance !== undefined && initialRecord?.distance !== null) {
        const d = parseFloat(String(initialRecord.distance))
        setDistance(isNaN(d) ? '5.00' : d.toFixed(2))
      }
      if (initialRecord?.pace) {
        setPace(initialRecord.pace)
        setShowPace(true)
      } else {
        setPace('')
        setShowPace(false)
      }
      if (initialRecord?.durationMinutes) {
        const dur = initialRecord.durationMinutes
        setTime(typeof dur === 'number' ? `${dur}:00` : String(dur))
        setShowTime(true)
      } else {
        setTime('')
        setShowTime(false)
      }
      if (initialRecord?.runDate) {
        setRunDate(initialRecord.runDate)
        setShowRunDate(true)
      }
    }
  }, [isOpen, initialRecord])

  // 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setBgImage(img)
      }
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

      // 가독성을 위한 위치별 전용 그라데이션 오버레이
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      if (textPosition === 'BOTTOM') {
        // 하단 텍스트일 때: 사진 중앙(얼굴/인물)은 100% 투명 유지, 상단 브랜드와 하단 텍스트 영역만 그림자
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)')
        gradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.0)')
        gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.0)')
        gradient.addColorStop(0.75, 'rgba(0, 0, 0, 0.4)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.88)')
      } else if (textPosition === 'TOP') {
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.88)')
        gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.2)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)')
      } else {
        // CENTER
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)')
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)')
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
      } else if (theme === 'ORANGE') {
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        bgGrad.addColorStop(0, '#1c1917')
        bgGrad.addColorStop(1, '#0c0a09')
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else {
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    // 테마별 폰트 컬러 명확 분기
    let primaryColor = '#CCFF00' // NEON: SRC 시그니처 형광 옐로우
    let textColor = '#ffffff'
    let subTextColor = '#94a3b8'

    if (theme === 'DARK') {
      primaryColor = '#ffffff' // DARK: 미니멀 순백색 (올 화이트)
      textColor = '#ffffff'
      subTextColor = '#64748b'
    } else if (theme === 'ORANGE') {
      primaryColor = '#ff5500' // ORANGE: 나이키 클래식 세이프티 오렌지
      textColor = '#ffffff'
      subTextColor = '#cbd5e1'
    } else if (theme === 'MINIMAL') {
      primaryColor = '#0f172a' // MINIMAL: 화이트 배경 다크 슬레이트
      textColor = '#0f172a'
      subTextColor = '#64748b'
    }

    // 위치 좌표 계산 (기본 하단: BOTTOM -> 인물/얼굴 가림 방지)
    let distY = 990
    let lineY = 1090
    let colY = 1150
    let valY = 1215

    if (textPosition === 'TOP') {
      distY = 270
      lineY = 370
      colY = 430
      valY = 495
    } else if (textPosition === 'CENTER') {
      distY = 720
      lineY = 820
      colY = 880
      valY = 935
    }

    // 2. 상단 브랜딩 헤더 및 공식 '에쌀' 크루 로고 (안 A: 우측 상단 엠블럼)
    const logoImg = (theme === 'MINIMAL' || theme === 'ORANGE') ? (logoBlue || logoNeon) : (logoNeon || logoBlue)
    const logoY = textPosition === 'TOP' ? 50 : 60
    const logoWidth = 130
    const logoHeight = 130
    const logoX = canvas.width - 80 - logoWidth

    if (logoImg) {
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight)
    }

    ctx.font = 'bold 36px sans-serif'
    ctx.fillStyle = primaryColor
    ctx.fillText('SUWON RUNNING CREW', 80, textPosition === 'TOP' ? 90 : 120)

    // 3. 메인 거대 거리 수치 (NRC 수치 스타일)
    const distNumVal = parseFloat(distance || '0')
    const distText = isNaN(distNumVal) ? '0.00' : distNumVal.toFixed(2)
    
    ctx.font = '900 170px sans-serif'
    ctx.fillStyle = textColor
    ctx.fillText(distText, 80, distY)
    
    const distWidth = ctx.measureText(distText).width

    // KM 단위 배치
    ctx.font = 'bold 50px sans-serif'
    ctx.fillStyle = primaryColor
    ctx.fillText('KM', 80 + distWidth + 24, distY)

    // 4. 선택된 활성 메트릭스 항목 동적 배치 (선택하지 않은 항목은 깔끔하게 자동 생략)
    const activeMetrics: { label: string; value: string; color?: string }[] = []

    if (showPace && pace && pace.trim()) {
      activeMetrics.push({ label: 'PACE', value: pace.trim() })
    }
    if (showTime && time && time.trim()) {
      activeMetrics.push({ label: 'TIME', value: time.trim() })
    }
    if (showRunDate && runDate && runDate.trim()) {
      activeMetrics.push({ label: 'DATE', value: runDate.trim() })
    }
    if (showNickname && pureName) {
      activeMetrics.push({ label: 'RUNNER', value: pureName, color: primaryColor })
    }

    if (activeMetrics.length > 0) {
      // 세로 구분선
      ctx.strokeStyle = theme === 'MINIMAL' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(80, lineY)
      ctx.lineTo(canvas.width - 80, lineY)
      ctx.stroke()

      const count = activeMetrics.length
      const startX = 80
      const availableWidth = canvas.width - 160

      activeMetrics.forEach((m, idx) => {
        let colX = startX
        if (count > 1) {
          colX = startX + (idx * (availableWidth / (count - 1)))
          if (idx === count - 1) {
            ctx.textAlign = 'right'
            colX = canvas.width - 80
          } else {
            ctx.textAlign = 'left'
          }
        } else {
          ctx.textAlign = 'left'
        }

        ctx.font = 'bold 22px sans-serif'
        ctx.fillStyle = subTextColor
        ctx.fillText(m.label, colX, colY)

        ctx.font = 'bold 40px sans-serif'
        ctx.fillStyle = m.color || textColor
        ctx.fillText(m.value, colX, valY)
      })

      ctx.textAlign = 'left'
    }

    // 모바일 꾹 누르기 저장을 위한 이미지 URL 생성
    try {
      const dataUrl = canvas.toDataURL('image/png')
      setPreviewUrl(dataUrl)
    } catch (e) {}
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(renderCanvas, 80)
    }
  }, [isOpen, bgImage, theme, textPosition, distance, pace, time, runDate, pureName, showNickname, showRunDate, showPace, showTime, logoNeon, logoBlue])

  // 이미지 다운로드 (모바일 크로스 브라우저 호환)
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const image = previewUrl || canvas.toDataURL('image/png')

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      const win = window.open('')
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>SRC 인증샷 저장</title>
              <style>
                body { margin:0; background:#111; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; text-align:center; padding:16px; box-sizing:border-box; }
                img { max-width:100%; max-height:75vh; height:auto; border-radius:16px; box-shadow:0 8px 30px rgba(0,0,0,0.8); }
                p { margin-top:20px; font-size:15px; font-weight:bold; color:#CCFF00; word-break:keep-all; }
              </style>
            </head>
            <body>
              <img src="${image}" alt="SRC 러닝 인증샷" />
              <p>📱 이미지를 꾹 눌러서 "사진 앱에 저장"을 선택하세요!</p>
            </body>
          </html>
        `)
        win.document.close()
        return
      }
    }

    const link = document.createElement('a')
    link.href = image
    link.download = `SRC_RUN_${runDate}_${pureName || 'Runner'}.png`
    link.click()
  }

  // 모바일 웹 공유 API
  const handleShare = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const image = previewUrl || canvas.toDataURL('image/png')

    if (navigator.canShare) {
      try {
        const res = await fetch(image)
        const blob = await res.blob()
        const file = new File([blob], `SRC_RUN_${runDate}.png`, { type: 'image/png' })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'SRC 러닝 인증',
            text: '수원러닝크루(SRC) 러닝 인증샷!'
          })
          return
        }
      } catch (err) {}
    }

    handleDownload()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl my-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>🔥 SRC OFFICIAL RUN CARD</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* 캔버스 & 모바일 꾹누르기 이미지 미리보기 */}
        <div className="relative aspect-[4/5] max-h-[380px] w-full bg-gray-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-800">
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="SRC 러닝 인증샷"
              className="w-full h-full object-contain cursor-pointer select-none"
            />
          ) : (
            <div className="text-gray-400 text-xs font-bold animate-pulse">
              인증 카드 생성 중...
            </div>
          )}
        </div>

        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl font-bold text-center">
          📱 모바일: 이미지를 꾹 누르면 사진 앱에 직접 저장할 수 있습니다!
        </p>

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
              <div className="grid grid-cols-4 gap-0.5 rounded-xl bg-gray-100 p-1 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setTheme('NEON')}
                  className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                    theme === 'NEON' ? 'bg-gray-900 text-[#CCFF00] shadow-sm' : 'text-gray-500'
                  }`}
                >
                  네온
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('DARK')}
                  className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                    theme === 'DARK' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  다크
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('ORANGE')}
                  className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                    theme === 'ORANGE' ? 'bg-[#ff5500] text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  오렌지
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('MINIMAL')}
                  className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                    theme === 'MINIMAL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  화이트
                </button>
              </div>
            </div>
          </div>

          {/* 텍스트 위치 선택 (얼굴/사진 가림 방지) */}
          <div>
            <label className="block text-gray-500 font-bold mb-1">텍스트 위치 (얼굴/사진 가림 방지)</label>
            <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200">
              <button
                type="button"
                onClick={() => setTextPosition('BOTTOM')}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  textPosition === 'BOTTOM' ? 'bg-gray-900 text-[#CCFF00] shadow-sm' : 'text-gray-500'
                }`}
              >
                👇 하단 (권장)
              </button>
              <button
                type="button"
                onClick={() => setTextPosition('TOP')}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  textPosition === 'TOP' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                👆 상단
              </button>
              <button
                type="button"
                onClick={() => setTextPosition('CENTER')}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  textPosition === 'CENTER' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                ↔️ 중앙
              </button>
            </div>
          </div>

          {/* 카드 표시 항목 선택 */}
          <div>
            <label className="block text-gray-500 font-bold mb-1">카드 표시 항목 선택</label>
            <div className="flex flex-wrap gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={showPace}
                  onChange={e => setShowPace(e.target.checked)}
                  className="rounded text-gray-900 focus:ring-0"
                />
                ⚡ 페이스
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={showTime}
                  onChange={e => setShowTime(e.target.checked)}
                  className="rounded text-gray-900 focus:ring-0"
                />
                ⏱️ 시간
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={showRunDate}
                  onChange={e => setShowRunDate(e.target.checked)}
                  className="rounded text-gray-900 focus:ring-0"
                />
                📅 날짜
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={showNickname}
                  onChange={e => setShowNickname(e.target.checked)}
                  className="rounded text-gray-900 focus:ring-0"
                />
                👤 이름 ({pureName})
              </label>
            </div>
          </div>

          {/* 수치 및 값 입력 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-gray-500 font-bold mb-1 text-[11px]">거리 (KM)</label>
              <input
                type="text"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:outline-none focus:border-gray-900"
              />
            </div>
            {showPace && (
              <div>
                <label className="block text-gray-500 font-bold mb-1 text-[11px]">페이스</label>
                <input
                  type="text"
                  placeholder="5'30&quot;"
                  value={pace}
                  onChange={e => setPace(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:outline-none focus:border-gray-900"
                />
              </div>
            )}
            {showTime && (
              <div>
                <label className="block text-gray-500 font-bold mb-1 text-[11px]">운동시간</label>
                <input
                  type="text"
                  placeholder="25:00"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs focus:outline-none focus:border-gray-900"
                />
              </div>
            )}
            {showRunDate && (
              <div>
                <label className="block text-gray-500 font-bold mb-1 text-[11px]">날짜</label>
                <input
                  type="date"
                  value={runDate}
                  onChange={e => setRunDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-[11px] focus:outline-none focus:border-gray-900"
                />
              </div>
            )}
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
