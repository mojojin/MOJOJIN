import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f2027',
}

export const metadata: Metadata = {
  title: '수원러닝크루 (SRC)',
  description: 'SRC 멤버 전용 러닝 기록 인증 및 생존 관리 플랫폼',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SRC',
  },
  icons: {
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
