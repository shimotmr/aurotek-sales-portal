'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface Case {
  id: string
  stage: string
  orderId?: string
  rep: string
  dealer: string
  endCustomer?: string
  machine?: string
  probability: number
  quantity: number
  amount: number
  expected: number
  orderDate?: string
  shipDate?: string
  category?: string
  brand?: string
  failReason?: string
}

interface CasesData {
  cases: Case[]
  updatedAt: string
}

function formatNumber(num: number): string {
  return num.toLocaleString('zh-TW')
}

const stageColors: Record<string, { bg: string; text: string; badge: string }> = {
  '進行中': { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-500' },
  '待出貨': { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-500' },
  '已出貨': { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-500' },
  '失敗': { bg: 'bg-gray-50', text: 'text-gray-600', badge: 'bg-gray-400' },
}

function CasesContent() {
  const searchParams = useSearchParams()
  const stageFilter = searchParams.get('stage')
  const dealerFilter = searchParams.get('dealer')
  const repFilter = searchParams.get('rep')
  const probMinFilter = searchParams.get('probMin')
  const probMaxFilter = searchParams.get('probMax')
  
  const [data, setData] = useState<CasesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStage, setSelectedStage] = useState<string | null>(stageFilter)
  const [selectedDealer, setSelectedDealer] = useState<string | null>(dealerFilter)
  const [selectedRep, setSelectedRep] = useState<string | null>(repFilter)
  const [probMin, setProbMin] = useState<number | null>(probMinFilter ? parseInt(probMinFilter) : null)
  const [probMax, setProbMax] = useState<number | null>(probMaxFilter ? parseInt(probMaxFilter) : null)
  const [sortField, setSortField] = useState<string>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    setSelectedStage(stageFilter)
    setSelectedDealer(dealerFilter)
    setSelectedRep(repFilter)
    setProbMin(probMinFilter ? parseInt(probMinFilter) : null)
    setProbMax(probMaxFilter ? parseInt(probMaxFilter) : null)
  }, [stageFilter, dealerFilter, repFilter, probMinFilter, probMaxFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">載入失敗</p>
      </div>
    )
  }

  // 篩選
  let filtered = data.cases
  if (selectedStage) {
    filtered = filtered.filter(c => c.stage === selectedStage)
  }
  if (selectedDealer) {
    filtered = filtered.filter(c => c.dealer === selectedDealer)
  }
  if (selectedRep) {
    filtered = filtered.filter(c => c.rep === selectedRep)
  }
  if (probMin !== null) {
    filtered = filtered.filter(c => c.probability >= probMin)
  }
  if (probMax !== null) {
    filtered = filtered.filter(c => c.probability <= probMax)
  }
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.dealer.toLowerCase().includes(q) ||
      (c.endCustomer?.toLowerCase().includes(q)) ||
      c.rep.toLowerCase().includes(q) ||
      (c.machine?.toLowerCase().includes(q))
    )
  }

  // 排序
  filtered = [...filtered].sort((a, b) => {
    let aVal: any = a[sortField as keyof Case]
    let bVal: any = b[sortField as keyof Case]
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const stages = ['進行中', '待出貨', '已出貨', '失敗']
  const stageCounts = stages.reduce((acc, s) => {
    acc[s] = data.cases.filter(c => c.stage === s).length
    return acc
  }, {} as Record<string, number>)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/performance" className="text-blue-600 hover:underline text-sm">← 返回 Dashboard</a>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">📋 案件列表</h1>
          </div>
          <div className="text-sm text-gray-500">
            更新：{new Date(data.updatedAt).toLocaleString('zh-TW')}
          </div>
        </div>

        {/* 階段篩選 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedStage(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              !selectedStage ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            全部 ({data.cases.length})
          </button>
          {stages.map(stage => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedStage === stage
                  ? `${stageColors[stage].badge} text-white`
                  : `bg-white ${stageColors[stage].text} hover:${stageColors[stage].bg}`
              }`}
            >
              {stage} ({stageCounts[stage]})
            </button>
          ))}
        </div>

        {/* 搜尋 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="搜尋案件編號、經銷商、客戶、業務..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 結果數與篩選條件 */}
        <div className="text-sm text-gray-500 mb-4 flex items-center flex-wrap gap-2">
          <span>顯示 {filtered.length} 筆案件</span>
          {selectedStage && (
            <span className="inline-flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded">
              階段：{selectedStage}
              <button onClick={() => setSelectedStage(null)} className="ml-1 hover:text-blue-900">✕</button>
            </span>
          )}
          {selectedDealer && (
            <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-1 rounded">
              經銷商：{selectedDealer}
              <button onClick={() => setSelectedDealer(null)} className="ml-1 hover:text-green-900">✕</button>
            </span>
          )}
          {selectedRep && (
            <span className="inline-flex items-center bg-purple-100 text-purple-700 px-2 py-1 rounded">
              業務：{selectedRep}
              <button onClick={() => setSelectedRep(null)} className="ml-1 hover:text-purple-900">✕</button>
            </span>
          )}
          {(probMin !== null || probMax !== null) && (
            <span className="inline-flex items-center bg-orange-100 text-orange-700 px-2 py-1 rounded">
              成交率：{probMin ?? 0}% - {probMax ?? 100}%
              <button onClick={() => { setProbMin(null); setProbMax(null); }} className="ml-1 hover:text-orange-900">✕</button>
            </span>
          )}
          {(selectedStage || selectedDealer || selectedRep || probMin !== null || probMax !== null) && (
            <button 
              onClick={() => { 
                setSelectedStage(null); 
                setSelectedDealer(null); 
                setSelectedRep(null);
                setProbMin(null);
                setProbMax(null);
              }}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              清除所有篩選
            </button>
          )}
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                    案件編號 <SortIcon field="id" />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">階段</th>
                  <th className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('rep')}>
                    業務 <SortIcon field="rep" />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dealer')}>
                    經銷商 <SortIcon field="dealer" />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">終端客戶</th>
                  <th className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('probability')}>
                    機率 <SortIcon field="probability" />
                  </th>
                  <th className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                    金額(K) <SortIcon field="amount" />
                  </th>
                  <th className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('expected')}>
                    期望值(K) <SortIcon field="expected" />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('shipDate')}>
                    出貨日 <SortIcon field="shipDate" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={`${c.id}-${i}`} className={`border-b hover:bg-gray-50 ${stageColors[c.stage]?.bg || ''}`}>
                    <td className="py-3 px-4 font-mono text-xs">{c.id}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${stageColors[c.stage]?.badge || 'bg-gray-400'}`}>
                        {c.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4">{c.rep}</td>
                    <td className="py-3 px-4">{c.dealer}</td>
                    <td className="py-3 px-4 text-gray-500 truncate max-w-[150px]" title={c.endCustomer}>
                      {c.endCustomer || '-'}
                    </td>
                    <td className="text-right py-3 px-4">
                      {c.probability > 0 ? `${c.probability}%` : '-'}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {c.amount > 0 ? formatNumber(Math.round(c.amount)) : '-'}
                    </td>
                    <td className="text-right py-3 px-4 text-blue-600 font-medium">
                      {c.expected > 0 ? formatNumber(Math.round(c.expected)) : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {c.shipDate || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            沒有符合條件的案件
          </div>
        )}
      </div>
    </main>
  )
}

export default function CasesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CasesContent />
    </Suspense>
  )
}
