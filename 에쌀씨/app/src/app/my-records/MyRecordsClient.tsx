'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface RunningRecord {
  id: string
  run_date: string
  distance_km: number
  location_name_snapshot: string | null
  run_type: 'PERSONAL' | 'REGULAR'
  is_pacing: boolean
}

interface MyRecordsClientProps {
  nickname: string
  records: RunningRecord[]
}

type ViewMode = 'monthly' | 'yearly' | 'weekday' | 'range'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

/** SVG Bar Chart Component */
function BarChart({
  data,
  labels,
  unit,
  accentColor = '#10b981',
}: {
  data: number[]
  labels: string[]
  unit: string
  accentColor?: string
}) {
  const maxVal = Math.max(...data, 1)
  const barWidth = Math.min(40, Math.floor(280 / Math.max(data.length, 1)))
  const chartWidth = Math.max(data.length * (barWidth + 8) + 20, 300)
  const chartHeight = 180

  return (
    <div className="overflow-x-auto pb-2 -mx-1">
      <svg
        width={chartWidth}
        height={chartHeight + 40}
        viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
        className="min-w-full"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - chartHeight * ratio
          return (
            <g key={ratio}>
              <line x1="30" y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x="25" y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9">
                {Math.round(maxVal * ratio)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((value, i) => {
          const barHeight = (value / maxVal) * (chartHeight - 20)
          const x = 40 + i * (barWidth + 8)
          const y = chartHeight - barHeight

          return (
            <g key={i}>
              {/* Bar with gradient */}
              <defs>
                <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill={`url(#bar-grad-${i})`}
                className="transition-all duration-300"
              />
              {/* Value on top */}
              {value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.6)"
                  fontSize="9"
                  fontWeight="600"
                >
                  {value % 1 === 0 ? value : value.toFixed(1)}
                </text>
              )}
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="10"
                fontWeight="500"
              >
                {labels[i]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Stat Card */
function StatCard({ label, value, unit, icon }: { label: string; value: string | number; unit?: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-4 space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-extrabold text-white">{value}</span>
        {unit && <span className="text-xs text-gray-500 font-semibold">{unit}</span>}
      </div>
    </div>
  )
}

export default function MyRecordsClient({ nickname, records }: MyRecordsClientProps) {
  const router = useRouter()

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')

  // Monthly view state
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)

  // Range view state
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')

  // Yearly view state
  const [yearlyYear, setYearlyYear] = useState(now.getFullYear())

  // Parse records
  const parsedRecords = useMemo(() => {
    return records.map((r) => ({
      ...r,
      distance_km: parseFloat(String(r.distance_km)),
      dateObj: new Date(r.run_date),
    }))
  }, [records])

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set(parsedRecords.map((r) => r.dateObj.getFullYear()))
    years.add(now.getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [parsedRecords])

  // === Filtered records based on view mode ===
  const filteredRecords = useMemo(() => {
    switch (viewMode) {
      case 'monthly':
        return parsedRecords.filter((r) => {
          const d = r.dateObj
          return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth
        })
      case 'yearly':
        return parsedRecords.filter((r) => r.dateObj.getFullYear() === yearlyYear)
      case 'weekday':
        return parsedRecords // all records
      case 'range':
        if (!rangeStart || !rangeEnd) return []
        return parsedRecords.filter((r) => r.run_date >= rangeStart && r.run_date <= rangeEnd)
      default:
        return parsedRecords
    }
  }, [viewMode, parsedRecords, selectedYear, selectedMonth, yearlyYear, rangeStart, rangeEnd])

  // === Overall stats ===
  const totalStats = useMemo(() => {
    const totalRuns = parsedRecords.length
    const totalDistance = parsedRecords.reduce((sum, r) => sum + r.distance_km, 0)
    const avgDistance = totalRuns > 0 ? totalDistance / totalRuns : 0

    // This year
    const thisYear = now.getFullYear()
    const thisYearRecords = parsedRecords.filter((r) => r.dateObj.getFullYear() === thisYear)
    const thisYearDistance = thisYearRecords.reduce((sum, r) => sum + r.distance_km, 0)

    // This month
    const thisMonth = now.getMonth()
    const thisMonthRecords = parsedRecords.filter(
      (r) => r.dateObj.getFullYear() === thisYear && r.dateObj.getMonth() === thisMonth
    )
    const thisMonthDistance = thisMonthRecords.reduce((sum, r) => sum + r.distance_km, 0)

    // Best month
    const monthMap = new Map<string, number>()
    parsedRecords.forEach((r) => {
      const key = `${r.dateObj.getFullYear()}-${r.dateObj.getMonth() + 1}`
      monthMap.set(key, (monthMap.get(key) || 0) + r.distance_km)
    })
    let bestMonth = ''
    let bestMonthDist = 0
    monthMap.forEach((dist, key) => {
      if (dist > bestMonthDist) {
        bestMonthDist = dist
        bestMonth = key
      }
    })
    const bestMonthLabel = bestMonth
      ? `${bestMonth.split('-')[0]}년 ${bestMonth.split('-')[1]}월`
      : '-'

    return {
      totalRuns,
      totalDistance,
      avgDistance,
      thisYearDistance,
      thisMonthDistance,
      bestMonthLabel,
      bestMonthDist,
    }
  }, [parsedRecords])

  // === Monthly chart data ===
  const monthlyChartData = useMemo(() => {
    if (viewMode !== 'yearly') return { data: [], labels: [] }
    const monthData = Array(12).fill(0)
    filteredRecords.forEach((r) => {
      monthData[r.dateObj.getMonth()] += r.distance_km
    })
    return {
      data: monthData.map((d) => Math.round(d * 10) / 10),
      labels: MONTH_NAMES,
    }
  }, [viewMode, filteredRecords])

  // === Weekday chart data ===
  const weekdayChartData = useMemo(() => {
    if (viewMode !== 'weekday') return { distData: [], countData: [], labels: [] }
    const distData = Array(7).fill(0)
    const countData = Array(7).fill(0)
    parsedRecords.forEach((r) => {
      const day = r.dateObj.getDay()
      distData[day] += r.distance_km
      countData[day]++
    })
    return {
      distData: distData.map((d) => Math.round(d * 10) / 10),
      countData,
      labels: DAY_NAMES,
    }
  }, [viewMode, parsedRecords])

  // === Filtered stats ===
  const filteredStats = useMemo(() => {
    const total = filteredRecords.reduce((sum, r) => sum + r.distance_km, 0)
    const count = filteredRecords.length
    const avg = count > 0 ? total / count : 0
    const regularCount = filteredRecords.filter((r) => r.run_type === 'REGULAR').length
    const pacingCount = filteredRecords.filter((r) => r.is_pacing).length
    return { total, count, avg, regularCount, pacingCount }
  }, [filteredRecords])

  const viewModes: { key: ViewMode; label: string; icon: string }[] = [
    { key: 'monthly', label: '월간', icon: '📅' },
    { key: 'yearly', label: '연간', icon: '📊' },
    { key: 'weekday', label: '요일별', icon: '📆' },
    { key: 'range', label: '기간검색', icon: '🔍' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-semibold">대시보드</span>
          </button>
          <h1 className="text-base font-extrabold text-white">📊 나의 기록</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-6 pt-5">
        {/* Overall Summary Cards */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
            🏃 {nickname}의 전체 기록
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard icon="🔥" label="총 러닝 횟수" value={totalStats.totalRuns} unit="회" />
            <StatCard icon="🛣️" label="총 누적 거리" value={totalStats.totalDistance.toFixed(1)} unit="km" />
            <StatCard icon="📐" label="1회 평균 거리" value={totalStats.avgDistance.toFixed(1)} unit="km" />
            <StatCard icon="🗓️" label="이번 달 거리" value={totalStats.thisMonthDistance.toFixed(1)} unit="km" />
            <StatCard icon="📆" label="올해 거리" value={totalStats.thisYearDistance.toFixed(1)} unit="km" />
            <StatCard icon="🏆" label="최고 기록 월" value={totalStats.bestMonthLabel} />
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="space-y-4">
          <div className="flex gap-1.5 p-1 bg-black/30 rounded-2xl border border-white/5">
            {viewModes.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === key
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="text-sm">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* === Monthly View Controls === */}
          {viewMode === 'monthly' && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (selectedMonth === 1) {
                    setSelectedYear(selectedYear - 1)
                    setSelectedMonth(12)
                  } else {
                    setSelectedMonth(selectedMonth - 1)
                  }
                }}
                className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-base font-extrabold text-white min-w-[120px] text-center">
                {selectedYear}년 {selectedMonth}월
              </span>
              <button
                onClick={() => {
                  if (selectedMonth === 12) {
                    setSelectedYear(selectedYear + 1)
                    setSelectedMonth(1)
                  } else {
                    setSelectedMonth(selectedMonth + 1)
                  }
                }}
                className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* === Yearly View Controls === */}
          {viewMode === 'yearly' && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setYearlyYear(yearlyYear - 1)}
                className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-base font-extrabold text-white min-w-[80px] text-center">
                {yearlyYear}년
              </span>
              <button
                onClick={() => setYearlyYear(yearlyYear + 1)}
                className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* === Range View Controls === */}
          {viewMode === 'range' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">시작일</label>
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white [color-scheme:dark] outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">종료일</label>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white [color-scheme:dark] outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* === Chart Section === */}
        {viewMode === 'yearly' && monthlyChartData.data.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              📊 {yearlyYear}년 월별 달리기 거리 (km)
            </h3>
            <BarChart
              data={monthlyChartData.data}
              labels={monthlyChartData.labels}
              unit="km"
              accentColor="#10b981"
            />
          </div>
        )}

        {viewMode === 'weekday' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                📆 요일별 총 거리 (km)
              </h3>
              <BarChart
                data={weekdayChartData.distData}
                labels={weekdayChartData.labels}
                unit="km"
                accentColor="#10b981"
              />
            </div>
            <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                📆 요일별 달린 횟수 (회)
              </h3>
              <BarChart
                data={weekdayChartData.countData}
                labels={weekdayChartData.labels}
                unit="회"
                accentColor="#f59e0b"
              />
            </div>
          </div>
        )}

        {/* === Filtered Stats === */}
        {viewMode !== 'weekday' && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/5 bg-gray-900/40 p-3 text-center">
              <p className="text-lg font-extrabold text-white">{filteredStats.count}</p>
              <p className="text-[9px] text-gray-500 font-bold">달린 횟수</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-gray-900/40 p-3 text-center">
              <p className="text-lg font-extrabold text-emerald-400">{filteredStats.total.toFixed(1)}</p>
              <p className="text-[9px] text-gray-500 font-bold">총 거리 (km)</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-gray-900/40 p-3 text-center">
              <p className="text-lg font-extrabold text-amber-400">{filteredStats.avg.toFixed(1)}</p>
              <p className="text-[9px] text-gray-500 font-bold">평균 거리 (km)</p>
            </div>
          </div>
        )}

        {/* Additional stats row */}
        {viewMode !== 'weekday' && filteredStats.count > 0 && (
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-2.5 text-center">
              <p className="text-sm font-extrabold text-emerald-400">{filteredStats.regularCount}</p>
              <p className="text-[9px] text-gray-500 font-bold">🎉 벙 참가</p>
            </div>
            <div className="flex-1 rounded-xl border border-amber-500/10 bg-amber-500/5 p-2.5 text-center">
              <p className="text-sm font-extrabold text-amber-400">{filteredStats.count - filteredStats.regularCount}</p>
              <p className="text-[9px] text-gray-500 font-bold">🏃 개인런</p>
            </div>
            <div className="flex-1 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-2.5 text-center">
              <p className="text-sm font-extrabold text-cyan-400">{filteredStats.pacingCount}</p>
              <p className="text-[9px] text-gray-500 font-bold">🎈 페이싱</p>
            </div>
          </div>
        )}

        {/* === Record List === */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
            {viewMode === 'weekday' ? '전체 기록' : '상세 기록'} ({viewMode === 'weekday' ? parsedRecords.length : filteredRecords.length}건)
          </h3>

          {(viewMode === 'weekday' ? parsedRecords : filteredRecords).length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.01] py-10 text-center">
              <p className="text-sm text-gray-600">해당 기간의 기록이 없습니다.</p>
              <p className="text-xs text-gray-700 mt-1">열심히 달려볼까요? 🏃‍♂️</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {(viewMode === 'weekday' ? parsedRecords : filteredRecords).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-gray-900/40 px-3 py-2.5 hover:bg-gray-900/60 transition-all"
                >
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      record.run_type === 'REGULAR'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {record.run_type === 'REGULAR' ? '벙' : '개인'}
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    {record.distance_km.toFixed(1)}
                    <span className="text-xs text-gray-500 font-normal"> km</span>
                  </span>
                  {record.is_pacing && (
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      🎈페이서
                    </span>
                  )}
                  <div className="ml-auto text-right">
                    <p className="text-xs text-gray-500">{record.run_date}</p>
                    {record.location_name_snapshot && (
                      <p className="text-[9px] text-gray-600 truncate max-w-[100px]">
                        📍{record.location_name_snapshot}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
