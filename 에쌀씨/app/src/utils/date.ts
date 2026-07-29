/**
 * 한국 시간(KST, UTC+9) 기준으로 현재 날짜를 가진 Date 객체를 반환합니다.
 * Intl API를 사용하여 서버(UTC)와 클라이언트(KST) 간의 시간대 오차를 방지합니다.
 */
export function getKstDate(): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0'
  return new Date(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    parseInt(get('hour')),
    parseInt(get('minute')),
    parseInt(get('second'))
  )
}

/**
 * 한국 시간(KST) 기준으로 지정된 Date 객체의 YYYY-MM-DD 포맷을 구합니다.
 */
export function formatKstYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 한국 시간(KST) 기준으로 현재 년-월을 구합니다 (YYYY-MM).
 */
export function getKstMonthStr(): string {
  const kst = getKstDate()
  return `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, '0')}`
}
