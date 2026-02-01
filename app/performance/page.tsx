'use client'

import { useEffect, useState } from 'react'

interface PerformanceData {
  summary: {
    totalCases: number
    thisMonth: {
      month: number
      expected: number
      target: number
      gap: number
      rate: number
    }
    activeCases: number
  }
  monthlyStats: {
    month: number
    expected: number
    target: number
    gap: number
    rate: number
  }[]
  repStats: {
    rep: string
    totalExpected: number
    totalTarget: number
    rate: number
    caseCount: number
  }[]
  dealerStats: {
    dealer: string
    expected: number
    caseCount: number
  }[]
  stageStats: {
    stage: string
    count: number
    amount: number
  }[]
  updatedAt: string
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/" className="text-blue-600 hover:underline text-sm">← 返回首頁</a>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">📈 業績管理 Dashboard</h1>
          </div>
          <div className="text-sm text-gray-500">
            更新時間：{new Date(data.updatedAt).toLocaleString('zh-TW')}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* 本月達成率 */}
          <div className={`p-6 rounded-lg shadow ${getStatusBg(data.summary.thisMonth.rate)}`}>
            <div className="text-sm text-gray-600">{monthNames[data.summary.thisMonth.month]} 達成率</div>
            <div className={`text-4xl font-bold mt-2 ${getStatusColor(data.summary.thisMonth.rate)}`}>
              {data.summary.thisMonth.rate}%
            </div>
            <div className="text-sm text-gray-500 mt-2">
              期望 {formatNumber(data.summary.thisMonth.expected)}K / 目標 {formatNumber(data.summary.thisMonth.target)}K
            </div>
          </div>

          {/* 本月缺口 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">{monthNames[data.summary.thisMonth.month]} 缺口</div>
            <div className={`text-4xl font-bold mt-2 ${data.summary.thisMonth.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.thisMonth.gap >= 0 ? '+' : ''}{formatNumber(data.summary.thisMonth.gap)}K
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {data.summary.thisMonth.gap >= 0 ? '✅ 超額達成' : '⚠️ 需補足'}
            </div>
          </div>

          {/* 總案件數 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pipeline 總案件</div>
            <div className="text-4xl font-bold mt-2 text-blue-600">
              {formatNumber(data.summary.totalCases)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              進行中：{formatNumber(data.summary.activeCases)} 件
            </div>
          </div>

          {/* 年度期望值 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">年度期望值</div>
            <div className="text-4xl font-bold mt-2 text-purple-600">
              {formatNumber(data.monthlyStats.reduce((sum, m) => sum + m.expected, 0))}K
            </div>
            <div className="text-sm text-gray-500 mt-2">
              目標：{formatNumber(data.monthlyStats.reduce((sum, m) => sum + m.target, 0))}K
            </div>
          </div>
        </div>

        {/* 月度趨勢 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 月度達成趨勢</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">月份</th>
                  <th className="text-right py-2 px-4">期望值(K)</th>
                  <th className="text-right py-2 px-4">目標(K)</th>
                  <th className="text-right py-2 px-4">缺口(K)</th>
                  <th className="text-right py-2 px-4">達成率</th>
                  <th className="py-2 px-4 w-48">進度</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyStats.map(m => (
                  <tr key={m.month} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{monthNames[m.month]}</td>
                    <td className="text-right py-3 px-4">{formatNumber(m.expected)}</td>
                    <td className="text-right py-3 px-4">{formatNumber(m.target)}</td>
                    <td className={`text-right py-3 px-4 ${m.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.gap >= 0 ? '+' : ''}{formatNumber(m.gap)}
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${getStatusColor(m.rate)}`}>
                      {m.rate}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full ${m.rate >= 100 ? 'bg-green-500' : m.rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(m.rate, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 業務績效 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">👤 業務績效</h2>
            <div className="space-y-4">
              {data.repStats.map(rep => (
                <div key={rep.rep} className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{rep.rep}</span>
                    <span className={`font-semibold ${getStatusColor(rep.rate)}`}>
                      {rep.rate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full ${rep.rate >= 100 ? 'bg-green-500' : rep.rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(rep.rate, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>期望：{formatNumber(rep.totalExpected)}K</span>
                    <span>目標：{formatNumber(rep.totalTarget)}K</span>
                    <span>案件：{rep.caseCount}件</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 經銷商排名 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🏢 經銷商排名 (Top 10)</h2>
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
                      {formatNumber(dealer.expected)}K · {dealer.caseCount}件
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 案件階段分布 */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">📋 案件階段分布</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.stageStats.map(stage => (
              <div key={stage.stage} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">{stage.stage}</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">{stage.count} 件</div>
                <div className="text-sm text-gray-500">{formatNumber(stage.amount)}K</div>
              </div>
            ))}
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
