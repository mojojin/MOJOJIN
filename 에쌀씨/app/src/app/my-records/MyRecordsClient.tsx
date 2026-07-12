'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  accentColor = '#CCFF00',
}: {
  data: number[]
  labels: string[]
  unit: string
  accentColor?: string
}) {
  const maxVal = Math.max(...data, 1)
  const barWidth = Math.min(40, Math.floor(280 / Math.max(data.length, 1)))
  // 오른쪽 끝부분이 잘리는(드래그 시 짤림) 문제를 해결하기 위해 기본 여백을 50에서 80으로 늘립니다.
  const chartWidth = Math.max(data.length * (barWidth + 8) + 80, 300)
  const chartHeight = 180

  return (
    <div className="overflow-x-auto pb-2 -mx-2 px-2">
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
              <line x1="30" y1={y} x2={chartWidth} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <text x="25" y={y + 4} textAnchor="end" fill="rgba(0,0,0,0.4)" fontSize="9">
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
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill={accentColor}
                stroke="#b8e600"
                strokeWidth="1"
                className="transition-all duration-300"
              />
              {/* Value on top */}
              {value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fill="rgba(0,0,0,0.8)"
                  fontSize="9"
                  fontWeight="700"
                >
                  {value % 1 === 0 ? value : value.toFixed(1)}
                </text>
              )}
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor="middle"
                fill="rgba(0,0,0,0.5)"
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

function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-1 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-extrabold text-gray-900">{value}</span>
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

  const viewModes: { key: ViewMode; label: string }[] = [
    { key: 'monthly', label: '월간' },
    { key: 'yearly', label: '연간' },
    { key: 'weekday', label: '요일별' },
    { key: 'range', label: '기간검색' },
  ]

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all active:scale-95 group"
          >
            <svg className="h-5 w-5 transition-transform group-active:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-semibold">대시보드</span>
          </Link>
          <h1 className="text-base font-bold text-gray-900">나의 기록</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-6 pt-5">
        {/* View Mode Tabs */}
        <div className="space-y-4">
          <div className="flex gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-200">
            {viewModes.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                  viewMode === key
                    ? 'bg-[#CCFF00] border border-[#b8e600] text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
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
                className="p-2 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-base font-bold text-gray-900 min-w-[120px] text-center">
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
                className="p-2 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors active:scale-95"
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
                className="p-2 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-base font-bold text-gray-900 min-w-[80px] text-center">
                {yearlyYear}년
              </span>
              <button
                onClick={() => setYearlyYear(yearlyYear + 1)}
                className="p-2 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors active:scale-95"
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
                  className="w-full bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">종료일</label>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* === Chart Section === */}
        {viewMode === 'yearly' && monthlyChartData.data.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {yearlyYear}년 월별 달리기 거리 (km)
            </h3>
            <BarChart
              data={monthlyChartData.data}
              labels={monthlyChartData.labels}
              unit="km"
              accentColor="#CCFF00"
            />
          </div>
        )}

        {viewMode === 'weekday' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                요일별 총 거리 (km)
              </h3>
              <BarChart
                data={weekdayChartData.distData}
                labels={weekdayChartData.labels}
                unit="km"
                accentColor="#CCFF00"
              />
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                요일별 달린 횟수 (회)
              </h3>
              <BarChart
                data={weekdayChartData.countData}
                labels={weekdayChartData.labels}
                unit="회"
                accentColor="#CCFF00"
              />
            </div>
          </div>
        )}

        {/* === Filtered Stats === */}
        {viewMode !== 'weekday' && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-center shadow-sm">
              <p className="text-lg font-extrabold text-gray-900">{filteredStats.count}</p>
              <p className="text-[9px] text-gray-500 font-bold">달린 횟수</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-center shadow-sm">
              <p className="text-lg font-extrabold text-gray-900">{filteredStats.total.toFixed(1)}</p>
              <p className="text-[9px] text-gray-500 font-bold">총 거리 (km)</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-center shadow-sm">
              <p className="text-lg font-extrabold text-gray-900">{filteredStats.avg.toFixed(1)}</p>
              <p className="text-[9px] text-gray-500 font-bold">평균 거리 (km)</p>
            </div>
          </div>
        )}

        {/* Additional stats row */}
        {viewMode !== 'weekday' && filteredStats.count > 0 && (
          <div className="flex gap-2">
            <div className="flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-center">
              <p className="text-sm font-extrabold text-emerald-700">{filteredStats.regularCount}</p>
              <p className="text-[9px] text-emerald-600 font-bold">정기런 참가</p>
            </div>
            <div className="flex-1 rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-center">
              <p className="text-sm font-extrabold text-amber-700">{filteredStats.count - filteredStats.regularCount}</p>
              <p className="text-[9px] text-amber-600 font-bold">개인런</p>
            </div>
            <div className="flex-1 rounded-2xl border border-blue-200 bg-blue-50 p-2.5 text-center">
              <p className="text-sm font-extrabold text-blue-700">{filteredStats.pacingCount}</p>
              <p className="text-[9px] text-blue-600 font-bold">페이싱</p>
            </div>
          </div>
        )}

        {/* === Record List === */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
            {viewMode === 'weekday' ? '전체 기록' : '상세 기록'} ({viewMode === 'weekday' ? parsedRecords.length : filteredRecords.length}건)
          </h3>

          {(viewMode === 'weekday' ? parsedRecords : filteredRecords).length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 py-10 text-center">
              <p className="text-sm text-gray-500">해당 기간의 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {(viewMode === 'weekday' ? parsedRecords : filteredRecords).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 hover:bg-gray-50 transition-all active:scale-[0.99] shadow-sm"
                >
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-2xl border ${
                      record.run_type === 'REGULAR'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {record.run_type === 'REGULAR' ? '정기런' : '개인런'}
                  </span>
                  <span className="text-sm font-extrabold text-gray-900">
                    {record.distance_km.toFixed(1)}
                    <span className="text-xs text-gray-500 font-normal"> km</span>
                  </span>
                  {record.is_pacing && (
                    <span className="text-[9px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-2xl">
                      페이서
                    </span>
                  )}
                  <div className="ml-auto text-right">
                    <p className="text-xs text-gray-500 font-medium">{record.run_date}</p>
                    {record.location_name_snapshot && (
                      <p className="text-[9px] text-gray-400 truncate max-w-[100px] mt-0.5 font-bold">
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
