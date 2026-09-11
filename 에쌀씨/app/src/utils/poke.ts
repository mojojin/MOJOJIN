/**
 * 콕 찌르기 및 회비 안내 리마인더 문구 생성 및 공유 유틸리티
 */

export interface PokeSurvivalTarget {
  nickname: string
  monthStr: string
  requiredRegular: number
  requiredTotal: number
}

export interface PokeDuesTarget {
  nickname: string
  monthStr: string
  amount: number
  accountInfo?: string
}

/**
 * 생존 알림 콕 찌르기 메시지 생성
 */
export function generateSurvivalPokeMessage(target: PokeSurvivalTarget): string {
  const [year, month] = target.monthStr.split('-')
  const monthNum = parseInt(month, 10)

  let reqText = ''
  if (target.requiredRegular > 0 && target.requiredTotal > 0) {
    reqText = `정기런 ${target.requiredRegular}회 (총 ${target.requiredTotal}회)`
  } else if (target.requiredRegular > 0) {
    reqText = `정기런 ${target.requiredRegular}회`
  } else if (target.requiredTotal > 0) {
    reqText = `추가 런 ${target.requiredTotal}회`
  } else {
    reqText = `인증`
  }

  return `[SRC 생존 알림 🏃‍♂️]\n\n안녕하세요 ${target.nickname}님!\n${monthNum}월 생존 달성까지 ${reqText}가 남아있어요!\n\n서둘러 정기런에 참여하거나 기록을 인증해 주세요 💪\nhttps://mojojin.vercel.app`
}

/**
 * 회비 안내 메시지 생성
 */
export function generateDuesPokeMessage(target: PokeDuesTarget): string {
  const [year, month] = target.monthStr.split('-')
  const monthNum = parseInt(month, 10)
  const formattedAmount = target.amount.toLocaleString()

  return `[SRC 회비 납부 안내 💰]\n\n안녕하세요 ${target.nickname}님!\n${monthNum}월 SRC 회비(₩${formattedAmount}) 납부 안내드립니다.\n\n가급적 정산 마감 전까지 아래 계좌로 입금 부탁드립니다 🙏\n입금 후 회비 탭에서 확인해 주세요!\nhttps://mojojin.vercel.app/expenses`
}

/**
 * 텍스트 클립보드 복사 헬퍼
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    }
  } catch (err) {
    return false
  }
}
