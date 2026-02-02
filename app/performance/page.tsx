'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface MonthStat {
  month: number
  actual: number      // 已出貨（實際業績）
  forecast: number    // 預測（進行中+待出貨）
  target: number
  gap: number
  rate: number
  type: 'actual' | 'forecast'
}

interface PerformanceData {
  summary: {
    totalCases: number
    activeCases: number
    thisMonth: MonthStat
    ytd: {
      shipped: number
      target: number
      rate: number
    }
  }
  monthlyStats: MonthStat[]
  repStats: {
    rep: string
    totalShipped: number
    totalForecast: number
    totalTarget: number
    rate: number
    caseCount: number
  }[]
  dealerStats: {
    dealer: string
    shipped: number
    caseCount: number
  }[]
  stageStats: {
    stage: string
    count: number
    amount: number
  }[]
  updatedAt: string
  currentMonth: number
}

interface Case {
  id: string
  stage: string
  rep: string
  dealer: string
  probability: number
  amount: number
}

interface CasesData {
  cases: Case[]
}

// 目前在職的業務員（與 admin/team 同步）
const ACTIVE_REPS = ['喬紹恆']

// 經銷商清單（有效的經銷商）
const VALID_DEALERS = ['阜爾運通', '禾煜科技', '智領未來', '禾達工業', '季河資訊', '鋥承', '鴻匠', '傑融科技', '谷得智能', '瑞興']

// 漏斗階段（只有 25%, 50%, 75%）
const FUNNEL_STAGES = [
  { label: '25', minProb: 0, maxProb: 25, color: '#5DADE2' },
  { label: '50', minProb: 26, maxProb: 50, color: '#58D68D' },
  { label: '75', minProb: 51, maxProb: 75, color: '#F4D03F' },
]

function formatNumber(num: number): string {
  return num.toLocaleString('zh-TW')
}

function getStatusColor(rate: number): string {
  if (rate >= 100) return 'text-green-600'
  if (rate >= 80) return 'text-yellow-600'
  return 'text-red-600'
}

function getStatusBg(rate: number): string {
  if (rate >= 100) return 'bg-green-100'
  if (rate >= 80) return 'bg-yellow-100'
  return 'bg-red-100'
}

export default function PerformancePage() {
  const router = useRouter()
  const [data, setData] = useState<PerformanceData | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 漏斗篩選
  const [funnelFilter, setFunnelFilter] = useState<'all' | 'rep' | 'dealer'>('all')
  const [selectedRep, setSelectedRep] = useState<string>('')
  const [selectedDealer, setSelectedDealer] = useState<string>('')

  useEffect(() => {
    Promise.all([
      fetch('/api/performance').then(res => res.json()),
      fetch('/data/cases.json').then(res => res.json())
    ])
      .then(([perfData, casesData]) => {
        setData(perfData)
        setCases(casesData.cases || [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // 計算漏斗資料
  const funnelData = useMemo(() => {
    const filtered = cases.filter(c => {
      if (c.stage !== '進行中') return false
      if (funnelFilter === 'rep' && selectedRep && c.rep !== selectedRep) return false
      if (funnelFilter === 'dealer' && selectedDealer && c.dealer !== selectedDealer) return false
      return true
    })

    return FUNNEL_STAGES.map(stage => {
      const stageCases = filtered.filter(c => 
        c.probability >= stage.minProb && c.probability <= stage.maxProb
      )
      const totalAmount = stageCases.reduce((sum, c) => sum + (c.amount || 0), 0)
      return { ...stage, count: stageCases.length, amount: totalAmount }
    })
  }, [cases, funnelFilter, selectedRep, selectedDealer])

  // 漏斗點擊跳轉
  const handleFunnelClick = (stage: typeof FUNNEL_STAGES[0]) => {
    const params = new URLSearchParams()
    params.set('probMin', stage.minProb.toString())
    params.set('probMax', stage.maxProb.toString())
    params.set('stage', '進行中')
    if (funnelFilter === 'rep' && selectedRep) params.set('rep', selectedRep)
    if (funnelFilter === 'dealer' && selectedDealer) params.set('dealer', selectedDealer)
    router.push(`/cases?${params.toString()}`)
  }

  // 漏斗 SVG 計算
  const maxAmount = Math.max(...funnelData.map(d => d.amount), 1)
  const getWidthForAmount = (amount: number) => {
    const ratio = amount / maxAmount
    return 60 + 340 * (0.15 + ratio * 0.85)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>載入失敗：{error || '未知錯誤'}</p>
          <a href="/" className="text-blue-600 hover:underline mt-4 block">返回首頁</a>
        </div>
      </div>
    )
  }

  const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const currentMonth = data.currentMonth || new Date().getMonth() + 1

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/" className="text-blue-600 hover:underline text-sm">← 返回首頁</a>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">📈 業績管理 Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              ⚠️ 過去月份顯示實際業績（已出貨），當月及未來顯示預測
            </p>
          </div>
          <div className="text-sm text-gray-500">
            更新時間：{new Date(data.updatedAt).toLocaleString('zh-TW')}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* YTD 達成率 */}
          <div className={`p-6 rounded-lg shadow ${getStatusBg(data.summary.ytd.rate)}`}>
            <div className="text-sm text-gray-600">YTD 達成率</div>
            <div className={`text-4xl font-bold mt-2 ${getStatusColor(data.summary.ytd.rate)}`}>
              {data.summary.ytd.rate}%
            </div>
            <div className="text-sm text-gray-500 mt-2">
              已出貨 {formatNumber(data.summary.ytd.shipped)}K / 目標 {formatNumber(data.summary.ytd.target)}K
            </div>
          </div>

          {/* 本月狀況 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">{monthNames[currentMonth]} 狀況</div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-blue-600">
                已出貨 {formatNumber(data.summary.thisMonth.actual)}K
              </div>
              <div className="text-lg text-purple-600">
                + 預測 {formatNumber(data.summary.thisMonth.forecast)}K
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              目標 {formatNumber(data.summary.thisMonth.target)}K
            </div>
          </div>

          {/* 進行中案件 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">進行中案件</div>
            <div className="text-4xl font-bold mt-2 text-orange-600">
              {formatNumber(data.summary.activeCases)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              進行中 + 待出貨
            </div>
          </div>

          {/* 總案件數 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">總案件數</div>
            <div className="text-4xl font-bold mt-2 text-gray-600">
              {formatNumber(data.summary.totalCases)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              含已出貨、失敗案件
            </div>
          </div>
        </div>

        {/* 月度趨勢 - 響應式設計 */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 月度業績趨勢</h2>
          
          {/* 手機版：卡片式 */}
          <div className="md:hidden space-y-3">
            {data.monthlyStats.map(m => {
              const isActual = m.type === 'actual'
              const progressPercent = m.target > 0 ? Math.min((m.actual / m.target) * 100, 100) : 0
              const forecastPercent = m.target > 0 ? Math.min((m.forecast / m.target) * 100, 100 - progressPercent) : 0
              return (
                <div key={m.month} className={`p-4 rounded-lg border ${m.month === currentMonth ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{monthNames[m.month]}</span>
                      {m.month === currentMonth && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">當月</span>}
                      {isActual ? <span className="text-xs text-gray-400">實際</span> : <span className="text-xs text-purple-500">預測</span>}
                    </div>
                    <span className={`text-xl font-bold ${getStatusColor(m.rate)}`}>{m.rate}%</span>
                  </div>
                  
                  {/* 進度條 */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                    <div className="h-3 flex">
                      <div className="h-3 bg-green-500" style={{ width: `${progressPercent}%` }}></div>
                      {m.forecast > 0 && <div className="h-3 bg-purple-300" style={{ width: `${forecastPercent}%` }}></div>}
                    </div>
                  </div>
                  
                  {/* 數據 */}
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="text-gray-500">已出貨</div>
                      <div className="font-bold text-green-600">{formatNumber(m.actual)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">預測</div>
                      <div className="font-bold text-purple-600">{m.forecast > 0 ? formatNumber(m.forecast) : '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">目標</div>
                      <div className="font-bold">{formatNumber(m.target)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 桌面版：表格 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">月份</th>
                  <th className="text-right py-2 px-4">已出貨(K)</th>
                  <th className="text-right py-2 px-4">預測(K)</th>
                  <th className="text-right py-2 px-4">目標(K)</th>
                  <th className="text-right py-2 px-4">差距(K)</th>
                  <th className="text-right py-2 px-4">達成率</th>
                  <th className="py-2 px-4 w-48">進度</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyStats.map(m => {
                  const isActual = m.type === 'actual'
                  return (
                    <tr key={m.month} className={`border-b hover:bg-gray-50 ${m.month === currentMonth ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 px-4 font-medium">
                        {monthNames[m.month]}
                        {m.month === currentMonth && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">當月</span>}
                        {isActual && <span className="ml-2 text-xs text-gray-400">實際</span>}
                        {!isActual && <span className="ml-2 text-xs text-purple-400">預測</span>}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-green-600">
                        {formatNumber(m.actual)}
                      </td>
                      <td className="text-right py-3 px-4 text-purple-600">
                        {m.forecast > 0 ? formatNumber(m.forecast) : '-'}
                      </td>
                      <td className="text-right py-3 px-4">{formatNumber(m.target)}</td>
                      <td className={`text-right py-3 px-4 ${m.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.gap >= 0 ? '+' : ''}{formatNumber(m.gap)}
                      </td>
                      <td className={`text-right py-3 px-4 font-semibold ${getStatusColor(m.rate)}`}>
                        {m.rate}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div className="h-4 flex">
                            <div 
                              className="h-4 bg-green-500"
                              style={{ width: `${Math.min(m.actual / m.target * 100, 100)}%` }}
                            ></div>
                            {m.forecast > 0 && (
                              <div 
                                className="h-4 bg-purple-300"
                                style={{ width: `${Math.min(m.forecast / m.target * 100, 100 - m.actual / m.target * 100)}%` }}
                              ></div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          <span className="inline-block w-3 h-2 bg-green-500 mr-1"></span>已出貨
                          {m.forecast > 0 && <><span className="inline-block w-3 h-2 bg-purple-300 ml-2 mr-1"></span>預測</>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 銷售漏斗 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold">📊 Funnel分析（進行中案件）</h2>
            
            {/* 快速篩選 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setFunnelFilter('all'); setSelectedRep(''); setSelectedDealer(''); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  funnelFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              
              {/* 業務員快速選擇 */}
              {ACTIVE_REPS.map(rep => (
                <button
                  key={rep}
                  onClick={() => { setFunnelFilter('rep'); setSelectedRep(rep); setSelectedDealer(''); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    funnelFilter === 'rep' && selectedRep === rep 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  👤 {rep}
                </button>
              ))}
              
              {/* 經銷商下拉 */}
              <select
                value={funnelFilter === 'dealer' ? selectedDealer : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setFunnelFilter('dealer')
                    setSelectedDealer(e.target.value)
                    setSelectedRep('')
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border-0 cursor-pointer transition ${
                  funnelFilter === 'dealer' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600'
                }`}
              >
                <option value="">🏢 經銷商</option>
                {VALID_DEALERS.map(dealer => (
                  <option key={dealer} value={dealer}>{dealer}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 漏斗圖 + 統計 */}
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* SVG 漏斗 */}
            <div className="flex-1 flex justify-center">
              <svg viewBox="0 0 650 250" className="w-full max-w-lg" style={{ height: 'auto' }}>
                {funnelData.map((stage, index) => {
                  const layerHeight = 250 / funnelData.length
                  const topY = index * layerHeight
                  const bottomY = (index + 1) * layerHeight
                  const topWidth = getWidthForAmount(stage.amount)
                  const bottomWidth = index < funnelData.length - 1 
                    ? getWidthForAmount(funnelData[index + 1].amount)
                    : 60
                  const centerX = 250
                  
                  const points = `${centerX - topWidth/2},${topY} ${centerX + topWidth/2},${topY} ${centerX + bottomWidth/2},${bottomY} ${centerX - bottomWidth/2},${bottomY}`
                  const labelX = centerX + topWidth/2 + 20
                  const labelY = topY + layerHeight/2
                  
                  return (
                    <g key={stage.label}>
                      <polygon
                        points={points}
                        fill={stage.color}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onClick={() => handleFunnelClick(stage)}
                      />
                      <text x={labelX} y={labelY - 6} fill={stage.color} fontSize="16" fontWeight="bold">
                        {stage.label}
                      </text>
                      <text x={labelX} y={labelY + 14} fill="#666" fontSize="14">
                        {formatNumber(Math.round(stage.amount))}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* 統計卡片 */}
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-4">
              {funnelData.map(stage => (
                <div 
                  key={stage.label} 
                  className="p-3 rounded-lg text-center cursor-pointer hover:shadow-md transition"
                  style={{ backgroundColor: `${stage.color}20` }}
                  onClick={() => handleFunnelClick(stage)}
                >
                  <div className="text-xl font-bold" style={{ color: stage.color }}>{stage.count}</div>
                  <div className="text-xs text-gray-600">{stage.label}% 案件</div>
                  <div className="text-sm font-medium text-gray-700">{formatNumber(Math.round(stage.amount))}K</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            💡 漏斗寬度依金額比例變化，點擊區塊查看案件明細
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 業務績效 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">👤 業務績效（依已出貨排名）</h2>
            <div className="space-y-4">
              {data.repStats.map(rep => (
                <div key={rep.rep} className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{rep.rep}</span>
                    <span className={`font-semibold ${getStatusColor(rep.rate)}`}>
                      {rep.rate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                    <div className="h-3 flex">
                      <div 
                        className="h-3 bg-green-500"
                        style={{ width: `${Math.min(rep.rate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span className="text-green-600">已出貨：{formatNumber(rep.totalShipped)}K</span>
                    <span className="text-purple-600">預測：{formatNumber(rep.totalForecast)}K</span>
                    <span>目標：{formatNumber(rep.totalTarget)}K</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    案件數：{rep.caseCount} 件
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 經銷商排名 - 可點擊查看該經銷商已出貨案件 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🏢 經銷商排名（依已出貨，點擊查看明細）</h2>
            <div className="space-y-3">
              {data.dealerStats.map((dealer, idx) => (
                <a 
                  key={dealer.dealer} 
                  href={`/cases?stage=已出貨&dealer=${encodeURIComponent(dealer.dealer)}`}
                  className="flex items-center hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors cursor-pointer"
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium truncate text-blue-600 hover:underline">{dealer.dealer}</div>
                    <div className="text-sm text-gray-500">
                      <span className="text-green-600 font-semibold">{formatNumber(dealer.shipped)}K</span>
                      <span className="text-gray-400 ml-2">· {dealer.caseCount} 件出貨</span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* 案件階段分布 - 可點擊跳轉到案件列表 */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">📋 案件階段分布（點擊查看明細）</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.stageStats.map(stage => {
              const stageColors: Record<string, string> = {
                '進行中': 'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300',
                '待出貨': 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300',
                '已出貨': 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300',
                '失敗': 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }
              const textColors: Record<string, string> = {
                '進行中': 'text-orange-600',
                '待出貨': 'text-yellow-600',
                '已出貨': 'text-green-600',
                '失敗': 'text-gray-500'
              }
              return (
                <a 
                  key={stage.stage} 
                  href={`/cases?stage=${encodeURIComponent(stage.stage)}`}
                  className={`block p-4 rounded-lg border cursor-pointer transition-all ${stageColors[stage.stage] || 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="font-medium">{stage.stage}</div>
                  <div className={`text-2xl font-bold mt-1 ${textColors[stage.stage] || 'text-gray-600'}`}>
                    {stage.count} 件
                  </div>
                  <div className="text-sm text-gray-500">{formatNumber(stage.amount)}K</div>
                  <div className="text-xs text-blue-500 mt-2">→ 查看明細</div>
                </a>
              )
            })}
          </div>
        </div>

        {/* 底部間距 */}
        <div className="mt-8"></div>
      </div>
    </main>
  )
}
