'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import UserMenu from '../components/UserMenu'

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
  const overdueFilter = searchParams.get('overdue') // 過期案件篩選
  const shipDateFromFilter = searchParams.get('shipDateFrom') // 出貨日起始
  const shipDateToFilter = searchParams.get('shipDateTo') // 出貨日結束
  
  const [data, setData] = useState<CasesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStage, setSelectedStage] = useState<string | null>(stageFilter)
  const [selectedDealer, setSelectedDealer] = useState<string | null>(dealerFilter)
  const [selectedRep, setSelectedRep] = useState<string | null>(repFilter)
  const [probMin, setProbMin] = useState<number | null>(probMinFilter ? parseInt(probMinFilter) : null)
  const [probMax, setProbMax] = useState<number | null>(probMaxFilter ? parseInt(probMaxFilter) : null)
  const [overdue, setOverdue] = useState<boolean>(overdueFilter === 'true')
  const [shipDateFrom, setShipDateFrom] = useState<string>(shipDateFromFilter || '')
  const [shipDateTo, setShipDateTo] = useState<string>(shipDateToFilter || '')
  const [sortField, setSortField] = useState<string>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // 今天日期 (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0]

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
    setOverdue(overdueFilter === 'true')
    setShipDateFrom(shipDateFromFilter || '')
    setShipDateTo(shipDateToFilter || '')
  }, [stageFilter, dealerFilter, repFilter, probMinFilter, probMaxFilter, overdueFilter, shipDateFromFilter, shipDateToFilter])

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
  // 過期案件篩選（出貨日早於今天）
  if (overdue) {
    filtered = filtered.filter(c => c.shipDate && c.shipDate < today)
  }
  // 出貨日區間篩選
  if (shipDateFrom) {
    filtered = filtered.filter(c => c.shipDate && c.shipDate >= shipDateFrom)
  }
  if (shipDateTo) {
    filtered = filtered.filter(c => c.shipDate && c.shipDate <= shipDateTo)
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 md:top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
            </div>
            <span className="font-bold text-slate-800 text-sm sm:text-base">案件列表</span>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            更新：{new Date(data.updatedAt).toLocaleString('zh-TW')}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">

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

        {/* 搜尋 + 日期篩選 */}
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div>
            <input
              type="text"
              placeholder="搜尋案件編號、經銷商、客戶、業務..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-72 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">出貨日：</label>
            <input
              type="date"
              value={shipDateFrom}
              onChange={e => setShipDateFrom(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={shipDateTo}
              onChange={e => setShipDateTo(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overdue}
              onChange={e => setOverdue(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
              ⚠️ 只顯示過期案件
            </span>
          </label>
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
          {overdue && (
            <span className="inline-flex items-center bg-red-100 text-red-700 px-2 py-1 rounded">
              ⚠️ 過期案件（出貨日 &lt; {today}）
              <button onClick={() => setOverdue(false)} className="ml-1 hover:text-red-900">✕</button>
            </span>
          )}
          {(shipDateFrom || shipDateTo) && (
            <span className="inline-flex items-center bg-cyan-100 text-cyan-700 px-2 py-1 rounded">
              出貨日：{shipDateFrom || '...'} ~ {shipDateTo || '...'}
              <button onClick={() => { setShipDateFrom(''); setShipDateTo(''); }} className="ml-1 hover:text-cyan-900">✕</button>
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
                  <th className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('orderDate')}>
                    訂單日 <SortIcon field="orderDate" />
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
                      {c.orderDate || '-'}
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
