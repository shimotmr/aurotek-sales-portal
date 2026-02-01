'use client'

import { useEffect, useState } from 'react'

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
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/performance')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

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

        {/* 月度趨勢 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 月度業績趨勢</h2>
          <div className="overflow-x-auto">
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
                  const total = m.actual + m.forecast
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
                          {/* 已出貨部分 */}
                          <div className="h-4 flex">
                            <div 
                              className="h-4 bg-green-500"
                              style={{ width: `${Math.min(m.actual / m.target * 100, 100)}%` }}
                            ></div>
                            {/* 預測部分 */}
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

          {/* 經銷商排名 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🏢 經銷商排名（依已出貨）</h2>
            <div className="space-y-3">
              {data.dealerStats.map((dealer, idx) => (
                <div key={dealer.dealer} className="flex items-center">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium truncate">{dealer.dealer}</div>
                    <div className="text-sm text-gray-500">
                      <span className="text-green-600 font-semibold">{formatNumber(dealer.shipped)}K</span>
                      <span className="text-gray-400 ml-2">· {dealer.caseCount} 件出貨</span>
                    </div>
                  </div>
                </div>
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

        {/* 外部連結 */}
        <div className="mt-8 text-center">
          <a 
            href="https://docs.google.com/spreadsheets/d/1dRbzCeK0oVOt7S52H5lf6mgIR-6O-7hqIgh-2d001N4/" 
            target="_blank"
            className="text-blue-600 hover:underline"
          >
            📊 開啟 Google Sheets 完整資料
          </a>
        </div>
      </div>
    </main>
  )
}
