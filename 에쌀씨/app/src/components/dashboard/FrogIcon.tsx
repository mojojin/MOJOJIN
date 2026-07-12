import React from 'react'

export interface FrogIconProps {
  km: number
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export function getDistanceTier(km: number) {
  if (km < 300) return {
    id: 'bronze',
    label: '동메달 개구리',
    range: '0 ~ 300km',
    badge: '🥉',
    color: 'text-orange-400',
    gradient: { start: '#f97316', end: '#f59e0b' },
    glow: 'rgba(249, 115, 22, 0.4)',
    borderColor: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
    pulse: false
  }
  if (km < 600) return {
    id: 'silver',
    label: '은메달 개구리',
    range: '300 ~ 600km',
    badge: '🥈',
    color: 'text-slate-300',
    gradient: { start: '#94a3b8', end: '#cbd5e1' },
    glow: 'rgba(148, 163, 184, 0.4)',
    borderColor: 'border-slate-500/30',
    bg: 'bg-slate-500/10',
    pulse: false
  }
  if (km < 1000) return {
    id: 'gold',
    label: '금메달 개구리',
    range: '600 ~ 1,000km',
    badge: '🥇',
    color: 'text-yellow-400',
    gradient: { start: '#fbbf24', end: '#d97706' },
    glow: 'rgba(250, 204, 21, 0.6)',
    borderColor: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
    pulse: false
  }
  if (km < 1600) return {
    id: 'bronze-trophy',
    label: '동트로피 개구리',
    range: '1,000 ~ 1,600km',
    badge: '🥉🏆',
    color: 'text-orange-500',
    gradient: { start: '#ea580c', end: '#dc2626' },
    glow: 'rgba(234, 88, 12, 0.6)',
    borderColor: 'border-orange-600/30',
    bg: 'bg-orange-600/10',
    pulse: false
  }
  if (km < 2300) return {
    id: 'silver-trophy',
    label: '은트로피 개구리',
    range: '1,600 ~ 2,300km',
    badge: '🥈🏆',
    color: 'text-slate-400',
    gradient: { start: '#64748b', end: '#94a3b8' },
    glow: 'rgba(100, 116, 139, 0.6)',
    borderColor: 'border-slate-400/30',
    bg: 'bg-slate-400/10',
    pulse: false
  }
  if (km < 3000) return {
    id: 'gold-trophy',
    label: '금트로피 개구리',
    range: '2,300 ~ 3,000km',
    badge: '🥇🏆',
    color: 'text-yellow-300',
    gradient: { start: '#fde047', end: '#eab308' },
    glow: 'rgba(253, 224, 71, 0.8)',
    borderColor: 'border-yellow-400/40',
    bg: 'bg-yellow-400/15',
    pulse: false
  }
  if (km < 4000) return {
    id: 'bronze-plane',
    label: '동비행기 개구리',
    range: '3,000 ~ 4,000km',
    badge: '🛩️',
    color: 'text-sky-400',
    gradient: { start: '#38bdf8', end: '#0ea5e9' },
    glow: 'rgba(56, 189, 248, 0.6)',
    borderColor: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
    pulse: false
  }
  if (km < 5500) return {
    id: 'silver-plane',
    label: '은비행기 개구리',
    range: '4,000 ~ 5,500km',
    badge: '✈️',
    color: 'text-indigo-400',
    gradient: { start: '#6366f1', end: '#4f46e5' },
    glow: 'rgba(99, 102, 241, 0.7)',
    borderColor: 'border-indigo-400/30',
    bg: 'bg-indigo-400/10',
    pulse: false
  }
  return {
    id: 'gold-plane',
    label: '금비행기 개구리 🚀',
    range: '5,500km 이상',
    badge: '🚀',
    color: 'text-purple-400',
    gradient: { start: '#c084fc', end: '#ec4899' },
    glow: 'rgba(192, 132, 252, 0.9)',
    borderColor: 'border-purple-400/40',
    bg: 'bg-purple-400/15',
    pulse: true
  }
}

export default function FrogIcon({ km, className = '', size = 'md' }: FrogIconProps) {
  const tier = getDistanceTier(km)
  
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const gradientId = `frog-grad-${tier.id}`
  
  // 모바일 렌더링 극심한 렉 유발 원인인 filter: drop-shadow 대신 단순 테두리 빛번짐(glow) 클래스 사용으로 최적화.
  const shadowClass = tier.pulse ? `shadow-[0_0_12px_${tier.glowColor}]` : ''

  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${sizeClasses[size]} ${className} ${tier.pulse ? 'animate-pulse' : ''} ${shadowClass} transition-all duration-300 inline-block rounded-full`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={tier.gradient.start} />
          <stop offset="100%" stopColor={tier.gradient.end} />
        </linearGradient>
      </defs>
      
      {/* Frog body/face */}
      <ellipse cx="50" cy="55" rx="38" ry="28" fill={`url(#${gradientId})`} />
      
      {/* Left eye outer */}
      <circle cx="28" cy="32" r="14" fill={`url(#${gradientId})`} />
      
      {/* Right eye outer */}
      <circle cx="72" cy="32" r="14" fill={`url(#${gradientId})`} />
      
      {/* Left eye white */}
      <circle cx="28" cy="32" r="9" fill="#ffffff" />
      
      {/* Right eye white */}
      <circle cx="72" cy="32" r="9" fill="#ffffff" />
      
      {/* Left eye pupil */}
      <circle cx="28" cy="32" r="5" fill="#111827" />
      
      {/* Right eye pupil */}
      <circle cx="72" cy="32" r="5" fill="#111827" />
      
      {/* Left eye highlight */}
      <circle cx="26" cy="30" r="2" fill="#ffffff" />
      
      {/* Right eye highlight */}
      <circle cx="70" cy="30" r="2" fill="#ffffff" />
      
      {/* Smile Mouth */}
      <path 
        d="M 35 60 Q 50 72 65 60" 
        stroke="#111827" 
        strokeWidth="4" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Blush Cheeks */}
      <circle cx="23" cy="56" r="4.5" fill="#f87171" opacity="0.6" />
      <circle cx="77" cy="56" r="4.5" fill="#f87171" opacity="0.6" />
    </svg>
  )
}
