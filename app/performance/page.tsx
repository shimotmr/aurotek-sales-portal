'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UserMenu from '../components/UserMenu'

// ─── Types ───
interface MonthStat {
  month: number; actual: number; forecast: number; target: number; gap: number; rate: number; type: 'actual' | 'forecast'
}
interface PerformanceData {
  summary: { totalCases: number; activeCases: number; thisMonth: MonthStat; ytd: { shipped: number; target: number; rate: number } }
  monthlyStats: MonthStat[]; repStats: { rep: string; totalShipped: number; totalForecast: number; totalTarget: number; rate: number; caseCount: number }[]
  dealerStats: { dealer: string; shipped: number; caseCount: number }[]; stageStats: { stage: string; count: number; amount: number }[]
  updatedAt: string; currentMonth: number
}
interface Case { id: string; stage: string; rep: string; dealer: string; probability: number; amount: number; orderDate?: string; shipDate?: string; customer?: string }
interface AlertRule { id: string; name: string; description: string; check: (c: Case[], t: string) => Case[]; filterUrl: (c: Case[]) => string }

// ─── Constants ───
const ALERT_RULES: AlertRule[] = [
  { id: 'overdue-in-progress', name: '進行中案件出貨日已過期', description: '進行中的案件出貨日早於今天，應調整出貨日或標記失敗',
    check: (cases, today) => cases.filter(c => c.stage === '進行中' && c.shipDate && c.shipDate < today), filterUrl: () => `/cases?stage=進行中&overdue=true` },
  { id: 'overdue-order-date', name: '預計取得訂單日已過期', description: '進行中的案件預計取得訂單日早於今天，應調整日期或結案',
    check: (cases, today) => cases.filter(c => c.stage === '進行中' && c.orderDate && c.orderDate < today), filterUrl: () => `/cases?stage=進行中` },
]
const ACTIVE_REPS = ['喬紹恆']
const VALID_DEALERS = ['阜爾運通', '禾煜科技', '智領未來', '禾達工業', '季河資訊', '鋥承', '鴻匠', '傑融科技', '谷得智能', '瑞興']
const FUNNEL_STAGES = [
  { label: '25', minProb: 0, maxProb: 25, color: '#5DADE2' },
  { label: '50', minProb: 26, maxProb: 50, color: '#E67E22' },
  { label: '75', minProb: 51, maxProb: 75, color: '#F4D03F' },
]
const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// ─── SVG Icons ───
const icons = {
  chart: <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><rect x="3" y="14" width="4" height="7" rx="1" fill="currentColor" opacity="0.4"/><rect x="10" y="9" width="4" height="12" rx="1" fill="currentColor" opacity="0.7"/><rect x="17" y="4" width="4" height="17" rx="1" fill="currentColor"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" opacity="0.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  shipped: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/></svg>,
  cases: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M9 9h6M9 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/></svg>,
  warning: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2"/></svg>,
  funnel: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M3 4h18l-6 8v6l-6 2V12L3 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  person: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="4" y="6" width="16" height="15" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M9 3h6v3H9z" stroke="currentColor" strokeWidth="2"/><path d="M9 13h6v8H9z" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" opacity="0.5"/><rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" opacity="0.5"/><rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" opacity="0.3"/></svg>,
  arrow: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>,
}

// ─── Helpers ───
function fmt(n: number) { return n.toLocaleString('zh-TW') }
function statusColor(r: number) { return r >= 100 ? '#059669' : r >= 80 ? '#D97706' : '#DC2626' }
function statusBg(r: number) { return r >= 100 ? '#ECFDF5' : r >= 80 ? '#FFFBEB' : '#FEF2F2' }

export default function PerformancePage() {
  const router = useRouter()
  const [data, setData] = useState<PerformanceData | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [funnelFilter, setFunnelFilter] = useState<'all' | 'rep' | 'dealer'>('all')
  const [selectedRep, setSelectedRep] = useState('')
  const [selectedDealer, setSelectedDealer] = useState('')

  useEffect(() => {
    Promise.all([fetch('/api/performance').then(r => r.json()), fetch('/data/cases.json').then(r => r.json())])
      .then(([p, c]) => { setData(p); setCases(c.cases || []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const funnelData = useMemo(() => {
    const filtered = cases.filter(c => {
      if (c.stage !== '進行中') return false
      if (funnelFilter === 'rep' && selectedRep && c.rep !== selectedRep) return false
      if (funnelFilter === 'dealer' && selectedDealer && c.dealer !== selectedDealer) return false
      return true
    })
    return FUNNEL_STAGES.map(s => {
      const sc = filtered.filter(c => c.probability >= s.minProb && c.probability <= s.maxProb)
      return { ...s, count: sc.length, amount: sc.reduce((sum, c) => sum + (c.amount || 0), 0) }
    })
  }, [cases, funnelFilter, selectedRep, selectedDealer])

  const handleFunnelClick = (stage: typeof FUNNEL_STAGES[0]) => {
    const p = new URLSearchParams()
    p.set('probMin', stage.minProb.toString()); p.set('probMax', stage.maxProb.toString()); p.set('stage', '進行中')
    if (funnelFilter === 'rep' && selectedRep) p.set('rep', selectedRep)
    if (funnelFilter === 'dealer' && selectedDealer) p.set('dealer', selectedDealer)
    router.push(`/cases?${p.toString()}`)
  }

  const maxAmount = Math.max(...funnelData.map(d => d.amount), 1)
  const getW = (a: number) => 60 + 340 * (0.15 + (a / maxAmount) * 0.85)

  const alerts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return ALERT_RULES.map(rule => {
      const v = rule.check(cases, today)
      return { ...rule, cases: v, count: v.length, amount: v.reduce((s, c) => s + (c.amount || 0), 0) }
    }).filter(a => a.count > 0)
  }, [cases])

  const monthlyForecastByProb = useMemo(() => {
    const r: Record<number, { prob25: number; prob50: number; prob75: number; total: number }> = {}
    for (let m = 1; m <= 12; m++) r[m] = { prob25: 0, prob50: 0, prob75: 0, total: 0 }
    cases.filter(c => c.stage === '進行中').forEach(c => {
      const sd = (c as any).shipDate; if (!sd) return
      const month = parseInt(sd.split('-')[1], 10); if (month < 1 || month > 12) return
      const a = c.amount || 0
      if (c.probability <= 25) r[month].prob25 += a
      else if (c.probability <= 50) r[month].prob50 += a
      else if (c.probability <= 75) r[month].prob75 += a
      r[month].total += a
    })
    return r
  }, [cases])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center"><div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto"/><p className="mt-3 text-sm text-slate-500">載入中...</p></div>
    </div>
  )
  if (error || !data) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center"><p className="text-red-500 text-sm">載入失敗：{error || '未知錯誤'}</p><Link href="/" className="text-sm text-blue-500 hover:underline mt-2 inline-block">返回首頁</Link></div>
    </div>
  )

  const currentMonth = data.currentMonth || new Date().getMonth() + 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Page Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 md:top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">{icons.chart}</div>
            <span className="font-bold text-slate-800 text-sm sm:text-base">業績管理</span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">更新 {new Date(data.updatedAt).toLocaleString('zh-TW')}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-xs text-slate-400 mb-4">過去月份顯示實際業績（已出貨），當月及未來顯示預測</p>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3 text-red-700 font-semibold text-sm">
              <span className="text-red-500">{icons.warning}</span>
              需要處理 ({alerts.reduce((s, a) => s + a.count, 0)} 件)
            </div>
            <div className="space-y-2">
              {alerts.map(a => (
                <a key={a.id} href={a.filterUrl(a.cases)} className="block p-3 bg-white border border-red-100 rounded-lg hover:bg-red-50/50 transition">
                  <div className="flex items-center justify-between">
                    <div><div className="text-sm font-medium text-red-700">{a.name}</div><div className="text-xs text-slate-500">{a.description}</div></div>
                    <div className="text-right"><div className="text-lg font-bold text-red-600">{a.count}</div><div className="text-xs text-slate-400">{fmt(Math.round(a.amount))}K</div></div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl p-4 shadow-sm border border-slate-100" style={{ background: statusBg(data.summary.ytd.rate) }}>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><span className="text-slate-400">{icons.target}</span>YTD 達成率</div>
            <div className="text-3xl font-bold" style={{ color: statusColor(data.summary.ytd.rate) }}>{data.summary.ytd.rate}%</div>
            <div className="text-xs text-slate-500 mt-1">已出貨 {fmt(data.summary.ytd.shipped)}K / 目標 {fmt(data.summary.ytd.target)}K</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><span className="text-blue-400">{icons.shipped}</span>{monthNames[currentMonth]}</div>
            <div className="text-2xl font-bold text-blue-600">{fmt(data.summary.thisMonth.actual)}K</div>
            <div className="text-sm text-violet-500">+預測 {fmt(data.summary.thisMonth.forecast)}K</div>
            <div className="text-xs text-slate-400 mt-1">目標 {fmt(data.summary.thisMonth.target)}K</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><span className="text-orange-400">{icons.cases}</span>進行中案件</div>
            <div className="text-3xl font-bold text-orange-500">{fmt(data.summary.activeCases)}</div>
            <div className="text-xs text-slate-400 mt-1">進行中 + 待出貨</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><span className="text-slate-400">{icons.grid}</span>總案件數</div>
            <div className="text-3xl font-bold text-slate-600">{fmt(data.summary.totalCases)}</div>
            <div className="text-xs text-slate-400 mt-1">含已出貨、失敗</div>
          </div>
        </div>

        {/* Monthly Trend */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><span className="text-blue-500">{icons.chart}</span>月度業績趨勢</h2>
          <div className="hidden sm:flex flex-wrap gap-3 text-xs mb-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"/><span className="text-slate-500">已出貨</span></span>
            {FUNNEL_STAGES.map(s => <span key={s.label} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: s.color}}/><span className="text-slate-500">{s.label}%</span></span>)}
          </div>
          <div className="space-y-3">
            {data.monthlyStats.map(m => {
              const mf = monthlyForecastByProb[m.month] || { prob25: 0, prob50: 0, prob75: 0, total: 0 }
              const isActual = m.type === 'actual'
              const totalPerf = m.actual + m.forecast
              const isOver = totalPerf >= m.target
              const gap = totalPerf - m.target
              const rate = m.month === currentMonth && m.target > 0 ? Math.round(totalPerf / m.target * 100) : m.rate
              const actualPct = m.target > 0 ? Math.min((m.actual / m.target) * 100, 100) : 0
              const p25Pct = m.target > 0 ? (mf.prob25 / m.target) * 100 : 0
              const p50Pct = m.target > 0 ? (mf.prob50 / m.target) * 100 : 0
              const p75Pct = m.target > 0 ? (mf.prob75 / m.target) * 100 : 0
              const hasStale = isActual && m.forecast > 0

              return (
                <div key={m.month} className={`p-4 rounded-xl border ${
                  hasStale ? 'border-orange-300 bg-orange-50/50' :
                  m.month === currentMonth ? 'border-blue-300 bg-blue-50/30' :
                  'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-800">{monthNames[m.month]}</span>
                      {m.month === currentMonth && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">當月</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        m.month === currentMonth ? 'bg-blue-100 text-blue-600' : isActual ? 'bg-slate-100 text-slate-500' : 'bg-violet-100 text-violet-600'
                      }`}>{m.month === currentMonth ? '實際+預測' : isActual ? '實際' : '預測'}</span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: statusColor(rate) }}>{rate}%</span>
                  </div>

                  {isActual && m.month !== currentMonth ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-center p-2.5 bg-slate-50 rounded-lg">
                          <div className="text-[10px] text-slate-400 mb-0.5">目標</div>
                          <div className="text-lg font-bold text-slate-700">{fmt(m.target)}K</div>
                        </div>
                        <div className={`text-center p-2.5 rounded-lg ${m.actual >= m.target ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          <div className="text-[10px] text-slate-400 mb-0.5">已出貨</div>
                          <div className={`text-lg font-bold ${m.actual >= m.target ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(m.actual)}K</div>
                        </div>
                      </div>
                      <div className={`text-center text-xs font-medium p-1.5 rounded-lg ${m.actual >= m.target ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        差距 {m.actual >= m.target ? '+' : ''}{fmt(m.actual - m.target)}K
                      </div>
                      <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden mt-3">
                        <div className="absolute right-0 top-0 h-full w-px bg-slate-400 z-10"/>
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(actualPct, 100)}%` }}/>
                      </div>
                      {hasStale && <div className="mt-2 text-[10px] text-orange-600 text-center">有過期預測案件，請查看頂部警告</div>}
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 bg-slate-50 rounded-lg"><div className="text-[10px] text-slate-400 mb-0.5">目標</div><div className="text-base font-bold text-slate-700">{fmt(m.target)}K</div></div>
                        <div className="text-center p-2 bg-emerald-50 rounded-lg"><div className="text-[10px] text-slate-400 mb-0.5">已出貨</div><div className="text-base font-bold text-emerald-600">{m.actual > 0 ? `${fmt(m.actual)}K` : '-'}</div></div>
                        <div className="text-center p-2 bg-violet-50 rounded-lg"><div className="text-[10px] text-slate-400 mb-0.5">預測</div><div className="text-base font-bold text-violet-600">{m.forecast > 0 ? `${fmt(Math.round(m.forecast))}K` : '-'}</div></div>
                      </div>
                      <div className={`flex items-center justify-center gap-2 text-xs font-medium p-1.5 rounded-lg ${isOver ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        <span>合計 {fmt(Math.round(totalPerf))}K</span><span className="text-slate-300">|</span><span>{isOver ? '+' : ''}{fmt(Math.round(gap))}K</span>
                      </div>
                      <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden mt-3">
                        <div className="absolute right-0 top-0 h-full w-px bg-slate-400 z-10"/>
                        <div className="h-full flex">
                          {actualPct > 0 && <div className="h-full bg-emerald-500" style={{ width: `${Math.min(actualPct, 100)}%` }}/>}
                          {p25Pct > 0 && <div className="h-full" style={{ width: `${p25Pct}%`, backgroundColor: '#5DADE2' }}/>}
                          {p50Pct > 0 && <div className="h-full" style={{ width: `${p50Pct}%`, backgroundColor: '#E67E22' }}/>}
                          {p75Pct > 0 && <div className="h-full" style={{ width: `${p75Pct}%`, backgroundColor: '#F4D03F' }}/>}
                        </div>
                      </div>
                      {m.forecast > 0 && (
                        <div className="flex flex-wrap gap-1.5 text-[10px] justify-center mt-2">
                          {m.actual > 0 && <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>已出貨 {fmt(m.actual)}</span>}
                          {mf.prob25 > 0 && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{backgroundColor:'#5DADE215', color:'#2980B9'}}><span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:'#5DADE2'}}/>25% {fmt(Math.round(mf.prob25))}</span>}
                          {mf.prob50 > 0 && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{backgroundColor:'#E67E2215', color:'#D35400'}}><span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:'#E67E22'}}/>50% {fmt(Math.round(mf.prob50))}</span>}
                          {mf.prob75 > 0 && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{backgroundColor:'#F4D03F15', color:'#B7950B'}}><span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:'#F4D03F'}}/>75% {fmt(Math.round(mf.prob75))}</span>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Funnel */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><span className="text-orange-500">{icons.funnel}</span>Funnel 分析（進行中）</h2>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => { setFunnelFilter('all'); setSelectedRep(''); setSelectedDealer('') }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${funnelFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>全部</button>
              {ACTIVE_REPS.map(rep => (
                <button key={rep} onClick={() => { setFunnelFilter('rep'); setSelectedRep(rep); setSelectedDealer('') }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${funnelFilter === 'rep' && selectedRep === rep ? 'bg-violet-500 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'}`}>{rep}</button>
              ))}
              <select value={funnelFilter === 'dealer' ? selectedDealer : ''} onChange={e => { if (e.target.value) { setFunnelFilter('dealer'); setSelectedDealer(e.target.value); setSelectedRep('') } }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer transition ${funnelFilter === 'dealer' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                <option value="">經銷商</option>
                {VALID_DEALERS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex-1 flex justify-center">
              <svg viewBox="0 0 700 250" className="w-full max-w-lg">
                {funnelData.map((stage, i) => {
                  const lh = 250 / funnelData.length, ty = i * lh, by = (i + 1) * lh
                  const tw = getW(stage.amount), bw = i < funnelData.length - 1 ? getW(funnelData[i + 1].amount) : 60
                  const cx = 220
                  return (
                    <g key={stage.label}>
                      <polygon points={`${cx-tw/2},${ty} ${cx+tw/2},${ty} ${cx+bw/2},${by} ${cx-bw/2},${by}`} fill={stage.color}
                        className="cursor-pointer transition-opacity hover:opacity-80" onClick={() => handleFunnelClick(stage)}/>
                      <text x={500} y={ty + lh/2 - 6} fill={stage.color} fontSize="18" fontWeight="bold">{stage.label}%</text>
                      <text x={500} y={ty + lh/2 + 16} fill="#64748B" fontSize="15">{fmt(Math.round(stage.amount))}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
              {funnelData.map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center cursor-pointer hover:shadow-md transition border border-slate-100"
                  style={{ backgroundColor: `${s.color}10` }} onClick={() => handleFunnelClick(s)}>
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.count}</div>
                  <div className="text-[10px] text-slate-500">{s.label}% 案件</div>
                  <div className="text-xs font-medium text-slate-700">{fmt(Math.round(s.amount))}K</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-4">漏斗寬度依金額比例變化，點擊區塊查看案件明細</p>
        </section>

        {/* Rep + Dealer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><span className="text-violet-500">{icons.person}</span>業務績效（依已出貨）</h2>
            <div className="space-y-4">
              {data.repStats.map(rep => (
                <div key={rep.rep} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-800">{rep.rep}</span>
                    <span className="text-sm font-bold" style={{ color: statusColor(rep.rate) }}>{rep.rate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(rep.rate, 100)}%` }}/>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="text-emerald-600">已出貨 {fmt(rep.totalShipped)}K</span>
                    <span className="text-violet-600">預測 {fmt(rep.totalForecast)}K</span>
                    <span>目標 {fmt(rep.totalTarget)}K</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">案件數 {rep.caseCount}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><span className="text-emerald-500">{icons.building}</span>經銷商排名（依已出貨）</h2>
            <div className="space-y-1">
              {data.dealerStats.map((d, i) => (
                <a key={d.dealer} href={`/cases?stage=已出貨&dealer=${encodeURIComponent(d.dealer)}`}
                  className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition group">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-300'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{d.dealer}</div>
                    <div className="text-xs text-slate-500"><span className="text-emerald-600 font-semibold">{fmt(d.shipped)}K</span> · {d.caseCount} 件</div>
                  </div>
                  <span className="text-slate-300 group-hover:text-slate-500 transition">{icons.arrow}</span>
                </a>
              ))}
            </div>
          </section>
        </div>

        {/* Stage Distribution */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><span className="text-slate-400">{icons.grid}</span>案件階段分布</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.stageStats.map(s => {
              const cfg: Record<string, { bg: string; border: string; text: string }> = {
                '進行中': { bg: 'bg-orange-50', border: 'border-orange-200 hover:border-orange-300', text: 'text-orange-600' },
                '待出貨': { bg: 'bg-amber-50', border: 'border-amber-200 hover:border-amber-300', text: 'text-amber-600' },
                '已出貨': { bg: 'bg-emerald-50', border: 'border-emerald-200 hover:border-emerald-300', text: 'text-emerald-600' },
                '失敗': { bg: 'bg-slate-50', border: 'border-slate-200 hover:border-slate-300', text: 'text-slate-500' },
              }
              const c = cfg[s.stage] || cfg['失敗']
              return (
                <a key={s.stage} href={`/cases?stage=${encodeURIComponent(s.stage)}`}
                  className={`block p-4 rounded-xl border transition-all hover:shadow-sm ${c.bg} ${c.border}`}>
                  <div className="text-xs font-medium text-slate-600">{s.stage}</div>
                  <div className={`text-2xl font-bold mt-1 ${c.text}`}>{s.count}</div>
                  <div className="text-xs text-slate-400">{fmt(s.amount)}K</div>
                </a>
              )
            })}
          </div>
        </section>

        <footer className="text-center text-xs text-slate-400 mt-8 pb-6">Aurotek Sales Portal · Powered by Jarvis</footer>
      </div>
    </div>
  )
}
