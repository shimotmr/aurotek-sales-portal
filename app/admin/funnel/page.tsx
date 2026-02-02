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
}

const FUNNEL_STAGES: FunnelStage[] = [
  { label: '25', minProb: 0, maxProb: 25, color: '#5DADE2' },
  { label: '50', minProb: 26, maxProb: 50, color: '#58D68D' },
  { label: '75', minProb: 51, maxProb: 75, color: '#F4D03F' },
]

export default function FunnelPage() {
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'rep' | 'dealer'>('all')
  const [filterValue, setFilterValue] = useState<string>('')

  useEffect(() => {
    fetch('/data/cases.json')
      .then(res => res.json())
      .then(data => {
        setCases(data.cases || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      if (c.stage !== '進行中') return false
      if (filterType === 'rep' && filterValue && c.rep !== filterValue) return false
      if (filterType === 'dealer' && filterValue && c.dealer !== filterValue) return false
      return true
    })
  }, [cases, filterType, filterValue])

  const funnelData = useMemo(() => {
    return FUNNEL_STAGES.map(stage => {
      const stageCases = filteredCases.filter(c => 
        c.probability >= stage.minProb && c.probability <= stage.maxProb
      )
      const totalAmount = stageCases.reduce((sum, c) => sum + (c.amount || 0), 0)
      return {
        ...stage,
        count: stageCases.length,
        amount: totalAmount,
      }
    })
  }, [filteredCases])

  const handleStageClick = (stage: FunnelStage) => {
    const params = new URLSearchParams()
    params.set('probMin', stage.minProb.toString())
    params.set('probMax', stage.maxProb.toString())
    params.set('stage', '進行中')
    if (filterType === 'rep' && filterValue) {
      params.set('rep', filterValue)
    }
    if (filterType === 'dealer' && filterValue) {
      params.set('dealer', filterValue)
    }
    router.push(`/cases?${params.toString()}`)
  }

  const handleFilterTypeChange = (type: 'all' | 'rep' | 'dealer') => {
    setFilterType(type)
    setFilterValue('')
  }

  const formatAmount = (amount: number) => {
    return Math.round(amount).toLocaleString('zh-TW')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">載入中...</div>
      </div>
    )
  }

  // SVG Funnel dimensions
  const svgWidth = 500
  const svgHeight = 300
  const funnelTopWidth = 400
  const funnelBottomWidth = 80
  const funnelStartX = (svgWidth - funnelTopWidth) / 2
  const totalLayers = funnelData.length

  // Calculate trapezoid points for each layer
  const getTrapezoidPoints = (index: number) => {
    const layerHeight = svgHeight / totalLayers
    const topY = index * layerHeight
    const bottomY = (index + 1) * layerHeight
    
    // Width narrows linearly from top to bottom
    const topWidthRatio = 1 - (index / totalLayers)
    const bottomWidthRatio = 1 - ((index + 1) / totalLayers)
    
    const topWidth = funnelBottomWidth + (funnelTopWidth - funnelBottomWidth) * topWidthRatio
    const bottomWidth = funnelBottomWidth + (funnelTopWidth - funnelBottomWidth) * bottomWidthRatio
    
    const topLeftX = (svgWidth - topWidth) / 2
    const topRightX = topLeftX + topWidth
    const bottomLeftX = (svgWidth - bottomWidth) / 2
    const bottomRightX = bottomLeftX + bottomWidth
    
    return `${topLeftX},${topY} ${topRightX},${topY} ${bottomRightX},${bottomY} ${bottomLeftX},${bottomY}`
  }

  // Get label position for each layer
  const getLabelPosition = (index: number) => {
    const layerHeight = svgHeight / totalLayers
    const y = index * layerHeight + layerHeight / 2
    return { x: svgWidth + 20, y }
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Filter Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 items-center">
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
        </div>

        {/* Funnel Chart */}
        <div className="bg-white p-8 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-center text-gray-700 mb-8">
            Funnel分析
            {filterType === 'rep' && filterValue && `（${filterValue}）`}
            {filterType === 'dealer' && filterValue && `（${filterValue}）`}
            {filterType === 'all' && '（通路營業部）'}
          </h2>
          
          <div className="flex justify-center">
            <svg 
              viewBox={`0 0 ${svgWidth + 150} ${svgHeight + 20}`}
              className="w-full max-w-2xl"
              style={{ height: 'auto' }}
            >
              {/* Funnel layers */}
              {funnelData.map((stage, index) => (
                <g key={stage.label}>
                  {/* Trapezoid */}
                  <polygon
                    points={getTrapezoidPoints(index)}
                    fill={stage.color}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => handleStageClick(stage)}
                  />
                  
                  {/* Right side labels */}
                  <text
                    x={getLabelPosition(index).x}
                    y={getLabelPosition(index).y - 8}
                    fill={stage.color}
                    fontSize="18"
                    fontWeight="bold"
                  >
                    {stage.label}
                  </text>
                  <text
                    x={getLabelPosition(index).x}
                    y={getLabelPosition(index).y + 16}
                    fill="#666"
                    fontSize="16"
                  >
                    {formatAmount(stage.amount)}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            💡 點擊漏斗區塊可查看該成交率的案件列表
          </p>
        </div>

        {/* Summary Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm mt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            {funnelData.map(stage => (
              <div key={stage.label} className="p-4 rounded-lg" style={{ backgroundColor: `${stage.color}20` }}>
                <div className="text-2xl font-bold" style={{ color: stage.color }}>
                  {stage.count}
                </div>
                <div className="text-sm text-gray-600">{stage.label}% 案件數</div>
                <div className="text-lg font-medium text-gray-700 mt-1">
                  {formatAmount(stage.amount)} K
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
