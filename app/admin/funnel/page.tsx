'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Case {
  id: string
  stage: string
  rep: string
  dealer: string
  endCustomer: string
  probability: number
  amount: number
  expected: number
}

interface FunnelStage {
  label: string
  minProb: number
  maxProb: number
  color: string
  bgColor: string
}

const FUNNEL_STAGES: FunnelStage[] = [
  { label: '25%', minProb: 0, maxProb: 25, color: '#ef4444', bgColor: '#fef2f2' },
  { label: '50%', minProb: 26, maxProb: 50, color: '#f59e0b', bgColor: '#fffbeb' },
  { label: '75%', minProb: 51, maxProb: 75, color: '#3b82f6', bgColor: '#eff6ff' },
  { label: '100%', minProb: 76, maxProb: 100, color: '#10b981', bgColor: '#ecfdf5' },
]

export default function FunnelPage() {
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'rep' | 'dealer'>('all')
  const [filterValue, setFilterValue] = useState<string>('')

  // Load cases data
  useEffect(() => {
    fetch('/data/cases.json')
      .then(res => res.json())
      .then(data => {
        setCases(data.cases || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Get unique reps and dealers
  const { reps, dealers } = useMemo(() => {
    const repSet = new Set<string>()
    const dealerSet = new Set<string>()
    cases.forEach(c => {
      if (c.rep) repSet.add(c.rep)
      if (c.dealer) dealerSet.add(c.dealer)
    })
    return {
      reps: Array.from(repSet).sort(),
      dealers: Array.from(dealerSet).sort()
    }
  }, [cases])

  // Filter cases (only 進行中)
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      if (c.stage !== '進行中') return false
      if (filterType === 'rep' && filterValue && c.rep !== filterValue) return false
      if (filterType === 'dealer' && filterValue && c.dealer !== filterValue) return false
      return true
    })
  }, [cases, filterType, filterValue])

  // Calculate funnel data
  const funnelData = useMemo(() => {
    return FUNNEL_STAGES.map(stage => {
      const stageCases = filteredCases.filter(c => 
        c.probability >= stage.minProb && c.probability <= stage.maxProb
      )
      const totalAmount = stageCases.reduce((sum, c) => sum + (c.amount || 0), 0)
      const totalExpected = stageCases.reduce((sum, c) => sum + (c.expected || 0), 0)
      return {
        ...stage,
        count: stageCases.length,
        amount: totalAmount,
        expected: totalExpected
      }
    })
  }, [filteredCases])

  // Max count for width calculation
  const maxCount = Math.max(...funnelData.map(d => d.count), 1)

  // Handle click on funnel stage
  const handleStageClick = (stage: FunnelStage) => {
    const params = new URLSearchParams()
    params.set('probMin', stage.minProb.toString())
    params.set('probMax', stage.maxProb.toString())
    if (filterType === 'rep' && filterValue) {
      params.set('rep', filterValue)
    }
    if (filterType === 'dealer' && filterValue) {
      params.set('dealer', filterValue)
    }
    router.push(`/cases?${params.toString()}`)
  }

  // Handle filter change
  const handleFilterTypeChange = (type: 'all' | 'rep' | 'dealer') => {
    setFilterType(type)
    setFilterValue('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold">📊 銷售漏斗</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4">🔍 篩選條件</h2>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Filter Type */}
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterTypeChange('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterType === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => handleFilterTypeChange('rep')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterType === 'rep'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                按營業員
              </button>
              <button
                onClick={() => handleFilterTypeChange('dealer')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterType === 'dealer'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                按經銷商
              </button>
            </div>

            {/* Filter Value Selector */}
            {filterType === 'rep' && (
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選擇營業員...</option>
                {reps.map(rep => (
                  <option key={rep} value={rep}>{rep}</option>
                ))}
              </select>
            )}
            {filterType === 'dealer' && (
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選擇經銷商...</option>
                {dealers.map(dealer => (
                  <option key={dealer} value={dealer}>{dealer}</option>
                ))}
              </select>
            )}
          </div>

          {/* Current Filter Display */}
          {(filterType !== 'all' && filterValue) && (
            <div className="mt-4 text-sm text-gray-600">
              目前篩選：<span className="font-medium text-blue-600">
                {filterType === 'rep' ? '營業員' : '經銷商'} - {filterValue}
              </span>
            </div>
          )}
        </div>

        {/* Funnel Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-6">🎯 銷售漏斗 (進行中案件)</h2>
          
          <div className="flex flex-col items-center gap-2">
            {funnelData.map((stage, index) => {
              // Calculate width: top is widest, bottom is narrowest
              // But width should also reflect the actual count
              const baseWidth = 100 - (index * 15) // 100%, 85%, 70%, 55%
              const countRatio = stage.count / maxCount
              const width = Math.max(baseWidth * countRatio, 20) // minimum 20%
              
              return (
                <div
                  key={stage.label}
                  onClick={() => handleStageClick(stage)}
                  className="relative cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    width: `${Math.max(85 - index * 15, 40)}%`,
                    clipPath: index === funnelData.length - 1
                      ? 'polygon(10% 0%, 90% 0%, 90% 100%, 10% 100%)'
                      : 'polygon(5% 0%, 95% 0%, 90% 100%, 10% 100%)',
                  }}
                >
                  <div
                    className="p-4 md:p-6 text-center rounded-lg border-2"
                    style={{
                      backgroundColor: stage.bgColor,
                      borderColor: stage.color,
                    }}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-lg md:text-xl font-bold"
                          style={{ color: stage.color }}
                        >
                          {stage.label}
                        </span>
                        <span className="text-gray-600 text-sm">成交率</span>
                      </div>
                      
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-center">
                          <div className="text-xl md:text-2xl font-bold" style={{ color: stage.color }}>
                            {stage.count}
                          </div>
                          <div className="text-xs text-gray-500">案件數</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg md:text-xl font-bold text-gray-700">
                            {(stage.amount / 1000).toFixed(0)}K
                          </div>
                          <div className="text-xs text-gray-500">金額</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg md:text-xl font-bold text-green-600">
                            {(stage.expected / 1000).toFixed(0)}K
                          </div>
                          <div className="text-xs text-gray-500">預估</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Click hint */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 group-hover:opacity-100 transition">
                      →
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            💡 點擊任一區塊可查看該成交率的案件列表
          </p>
        </div>

        {/* Summary Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4">📈 漏斗統計</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {filteredCases.length}
              </div>
              <div className="text-sm text-gray-600">總案件數</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(filteredCases.reduce((sum, c) => sum + (c.amount || 0), 0) / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-600">總金額</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(filteredCases.reduce((sum, c) => sum + (c.expected || 0), 0) / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-600">總預估值</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {filteredCases.length > 0 
                  ? Math.round(filteredCases.reduce((sum, c) => sum + (c.probability || 0), 0) / filteredCases.length)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">平均成交率</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
