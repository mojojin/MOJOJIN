import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '수원러닝크루 (SRC)',
  description: 'SRC 멤버 전용 러닝 기록 인증 및 생존 관리 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
