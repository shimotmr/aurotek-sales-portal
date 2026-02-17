'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'

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
  { label: '25', minProb: 0, maxProb: 25, color: 'var(--accent-blue-500)' },
  { label: '50', minProb: 26, maxProb: 50, color: 'var(--accent-orange-500)' },
  { label: '75', minProb: 51, maxProb: 75, color: 'var(--accent-yellow-500)' },
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
function statusColor(r: number) { return r >= 100 ? 'var(--status-success)' : r >= 80 ? 'var(--status-warning)' : 'var(--status-error)' }
function statusBg(r: number) { return r >= 100 ? 'var(--secondary-50)' : r >= 80 ? 'var(--accent-yellow-500)' : 'var(--primary-50)' }

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
    Promise.all([fetch('/api/performance').then(r => r.json()), fetch('/api/cases').then(r => r.json())])
      .then(([p, c]) => { setData(p); setCases(c.cases || c || []); setLoading(false) })
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface-0)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 mx-auto" style={{ borderColor: 'var(--primary-500)', borderTopColor: 'transparent' }}/>
        <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>載入中...</p>
      </div>
    </div>
  )
  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface-0)' }}>
      <div className="text-center">
        <p style={{ color: 'var(--status-error)' }}>載入失敗：{error || '未知錯誤'}</p>
        <Link href="/" className="text-sm hover:underline mt-2 inline-block" style={{ color: 'var(--primary-500)' }}>返回首頁</Link>
      </div>
    </div>
  )

  const currentMonth = data.currentMonth || new Date().getMonth() + 1

  return (
    <div className="performance-layout" style={{ backgroundColor: 'var(--surface-0)', minHeight: '100vh' }}>
      {/* Page Header */}
      <header className="page-header" style={{
        backgroundColor: 'var(--surface-1)',
        borderBottom: '1px solid var(--surface-3)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div className="header-inner">
          <div className="flex items-center gap-3">
            <div className="header-icon" style={{
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              borderRadius: '10px'
            }}>
              {icons.chart}
            </div>
            <span className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>業績管理</span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>更新 {new Date(data.updatedAt).toLocaleString('zh-TW')}</span>
        </div>
      </header>

      <main className="performance-main">
        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>過去月份顯示實際業績（已出貨），當月及未來顯示預測</p>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="alert-card" style={{
            backgroundColor: 'var(--primary-50)',
            border: '1px solid var(--primary-200)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div className="flex items-center gap-2 mb-3 font-semibold text-sm" style={{ color: 'var(--primary-700)' }}>
              <span style={{ color: 'var(--primary-500)' }}>{icons.warning}</span>
              需要處理 ({alerts.reduce((s, a) => s + a.count, 0)} 件)
            </div>
            <div className="space-y-2">
              {alerts.map(a => (
                <a key={a.id} href={a.filterUrl(a.cases)} className="block p-3 alert-item" style={{
                  backgroundColor: 'var(--surface-0)',
                  border: '1px solid var(--primary-100)',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease'
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--primary-700)' }}>{a.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: 'var(--primary-600)' }}>{a.count}</div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{fmt(Math.round(a.amount))}K</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Summary Cards - 使用新的 card-stats 樣式 */}
        <div className="stats-row">
          <div className="card-stats" style={{ background: statusBg(data.summary.ytd.rate) }}>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{icons.target}</span>YTD 達成率
            </div>
            <div className="text-3xl font-bold" style={{ color: statusColor(data.summary.ytd.rate) }}>{data.summary.ytd.rate}%</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>已出貨 {fmt(data.summary.ytd.shipped)}K / 目標 {fmt(data.summary.ytd.target)}K</div>
          </div>
          
          <div className="card-stats">
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-blue-500)' }}>{icons.shipped}</span>{monthNames[currentMonth]}
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-blue-500)' }}>{fmt(data.summary.thisMonth.actual)}K</div>
            <div className="text-sm" style={{ color: 'var(--accent-purple-500)' }}>+預測 {fmt(data.summary.thisMonth.forecast)}K</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>目標 {fmt(data.summary.thisMonth.target)}K</div>
          </div>
          
          <div className="card-stats">
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-orange-500)' }}>{icons.cases}</span>進行中案件
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--accent-orange-500)' }}>{fmt(data.summary.activeCases)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>進行中 + 待出貨</div>
          </div>
          
          <div className="card-stats">
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{icons.grid}</span>總案件數
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--text-secondary)' }}>{fmt(data.summary.totalCases)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>含已出貨、失敗</div>
          </div>
        </div>

        {/* Monthly Trend */}
        <section className="chart-section">
          <h2 className="section-title">
            <span style={{ color: 'var(--accent-blue-500)' }}>{icons.chart}</span>
            月度業績趨勢
          </h2>
          <div className="hidden sm:flex flex-wrap gap-3 text-xs mb-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--secondary-500)' }}/>
              <span style={{ color: 'var(--text-secondary)' }}>已出貨</span>
            </span>
            {FUNNEL_STAGES.map(s => (
              <span key={s.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }}/>
                <span style={{ color: 'var(--text-secondary)' }}>{s.label}%</span>
              </span>
            ))}
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
                <div key={m.month} className="month-card" style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: `1px solid ${hasStale ? 'var(--accent-orange-300)' : m.month === currentMonth ? 'var(--accent-blue-300)' : 'var(--surface-3)'}`,
                  backgroundColor: hasStale ? 'var(--accent-orange-50)' : m.month === currentMonth ? 'var(--accent-blue-50)' : 'var(--surface-1)'
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{monthNames[m.month]}</span>
                      {m.month === currentMonth && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}>當月</span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        m.month === currentMonth ? '' : isActual ? '' : ''
                      }`} style={{
                        backgroundColor: m.month === currentMonth ? 'var(--accent-blue-100)' : isActual ? 'var(--surface-2)' : 'var(--accent-purple-100)',
                        color: m.month === currentMonth ? 'var(--accent-blue-600)' : isActual ? 'var(--text-secondary)' : 'var(--accent-purple-600)'
                      }}>
                        {m.month === currentMonth ? '實際+預測' : isActual ? '實際' : '預測'}
                      </span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: statusColor(rate) }}>{rate}%</span>
                  </div>

                  {isActual && m.month !== currentMonth ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-center p-2.5 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
                          <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-tertiary)' }}>目標</div>
                          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(m.target)}K</div>
                        </div>
                        <div className="text-center p-2.5 rounded-lg" style={{ backgroundColor: m.actual >= m.target ? 'var(--secondary-50)' : 'var(--primary-50)' }}>
                          <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-tertiary)' }}>已出貨</div>
                          <div className="text-lg font-bold" style={{ color: m.actual >= m.target ? 'var(--secondary-600)' : 'var(--primary-500)' }}>{fmt(m.actual)}K</div>
                        </div>
                      </div>
                      <div className="text-center text-xs font-medium p-1.5 rounded-lg" style={{
                        backgroundColor: m.actual >= m.target ? 'var(--secondary-50)' : 'var(--primary-50)',
                        color: m.actual >= m.target ? 'var(--secondary-600)' : 'var(--primary-500)'
                      }}>
                        差距 {m.actual >= m.target ? '+' : ''}{fmt(m.actual - m.target)}K
                      </div>
                      <div className="relative h-3 rounded-full overflow-hidden mt-3" style={{ backgroundColor: 'var(--surface-2)' }}>
                        <div className="absolute right-0 top-0 h-full w-px z-10" style={{ backgroundColor: 'var(--text-tertiary)' }}/>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(actualPct, 100)}%`, backgroundColor: 'var(--secondary-500)' }}/>
                      </div>
                      {hasStale && <div className="mt-2 text-[10px] text-center" style={{ color: 'var(--accent-orange-600)' }}>有過期預測案件，請查看頂部警告</div>}
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
                          <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-tertiary)' }}>目標</div>
                          <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(m.target)}K</div>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--secondary-50)' }}>
                          <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-tertiary)' }}>已出貨</div>
                          <div className="text-base font-bold" style={{ color: 'var(--secondary-600)' }}>{m.actual > 0 ? `${fmt(m.actual)}K` : '-'}</div>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-purple-50)' }}>
                          <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-tertiary)' }}>預測</div>
                          <div className="text-base font-bold" style={{ color: 'var(--accent-purple-500)' }}>{m.forecast > 0 ? `${fmt(Math.round(m.forecast))}K` : '-'}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs font-medium p-1.5 rounded-lg" style={{
                        backgroundColor: isOver ? 'var(--secondary-50)' : 'var(--primary-50)',
                        color: isOver ? 'var(--secondary-600)' : 'var(--primary-500)'
                      }}>
                        <span>合計 {fmt(Math.round(totalPerf))}K</span>
                        <span style={{ color: 'var(--text-disabled)' }}>|</span>
                        <span>{isOver ? '+' : ''}{fmt(Math.round(gap))}K</span>
                      </div>
                      <div className="relative h-3 rounded-full overflow-hidden mt-3" style={{ backgroundColor: 'var(--surface-2)' }}>
                        <div className="absolute right-0 top-0 h-full w-px z-10" style={{ backgroundColor: 'var(--text-tertiary)' }}/>
                        <div className="h-full flex">
                          {actualPct > 0 && <div className="h-full" style={{ width: `${Math.min(actualPct, 100)}%`, backgroundColor: 'var(--secondary-500)' }}/>}
                          {p25Pct > 0 && <div className="h-full" style={{ width: `${p25Pct}%`, backgroundColor: 'var(--accent-blue-500)' }}/>}
                          {p50Pct > 0 && <div className="h-full" style={{ width: `${p50Pct}%`, backgroundColor: 'var(--accent-orange-500)' }}/>}
                          {p75Pct > 0 && <div className="h-full" style={{ width: `${p75Pct}%`, backgroundColor: 'var(--accent-yellow-500)' }}/>}
                        </div>
                      </div>
                      {(m.forecast > 0 || mf.total > 0 || !isActual) && (
                        <div className="flex flex-wrap gap-1.5 text-[10px] justify-center mt-2">
                          {m.actual > 0 && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--secondary-50)', color: 'var(--secondary-700)' }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--secondary-500)' }}/>已出貨 {fmt(m.actual)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', color: 'var(--accent-blue-500)' }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-blue-500)' }}/>25% {fmt(Math.round(mf.prob25))}
                          </span>
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255, 107, 53, 0.15)', color: 'var(--accent-orange-500)' }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-orange-500)' }}/>50% {fmt(Math.round(mf.prob50))}
                          </span>
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: 'var(--accent-yellow-600)' }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-yellow-500)' }}/>75% {fmt(Math.round(mf.prob75))}
                          </span>
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
        <section className="chart-section">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="section-title">
              <span style={{ color: 'var(--accent-orange-500)' }}>{icons.funnel}</span>
              Funnel 分析（進行中）
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => { setFunnelFilter('all'); setSelectedRep(''); setSelectedDealer('') }}
                className="filter-btn" style={{
                  backgroundColor: funnelFilter === 'all' ? 'var(--primary-500)' : 'var(--surface-2)',
                  color: funnelFilter === 'all' ? 'white' : 'var(--text-secondary)'
                }}>全部</button>
              {ACTIVE_REPS.map(rep => (
                <button key={rep} onClick={() => { setFunnelFilter('rep'); setSelectedRep(rep); setSelectedDealer('') }}
                  className="filter-btn" style={{
                    backgroundColor: funnelFilter === 'rep' && selectedRep === rep ? 'var(--accent-purple-500)' : 'var(--accent-purple-50)',
                    color: funnelFilter === 'rep' && selectedRep === rep ? 'white' : 'var(--accent-purple-600)'
                  }}>{rep}</button>
              ))}
              <select value={funnelFilter === 'dealer' ? selectedDealer : ''} onChange={e => { if (e.target.value) { setFunnelFilter('dealer'); setSelectedDealer(e.target.value); setSelectedRep('') } }}
                className="filter-select" style={{
                  backgroundColor: funnelFilter === 'dealer' ? 'var(--secondary-500)' : 'var(--secondary-50)',
                  color: funnelFilter === 'dealer' ? 'white' : 'var(--secondary-600)'
                }}>
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
                      <text x={500} y={ty + lh/2 + 16} fill="var(--text-secondary)" fontSize="15">{fmt(Math.round(stage.amount))}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
              {funnelData.map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center cursor-pointer transition border"
                  style={{ backgroundColor: `${s.color}15`, borderColor: 'var(--surface-3)' }} onClick={() => handleFunnelClick(s)}>
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.count}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{s.label}% 案件</div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(Math.round(s.amount))}K</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-[10px] mt-4" style={{ color: 'var(--text-tertiary)' }}>漏斗寬度依金額比例變化，點擊區塊查看案件明細</p>
        </section>

        {/* Rep + Dealer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="chart-section">
            <h2 className="section-title">
              <span style={{ color: 'var(--accent-purple-500)' }}>{icons.person}</span>
              業務績效（依已出貨）
            </h2>
            <div className="space-y-4">
              {data.repStats.map(rep => (
                <div key={rep.rep} className="rep-item" style={{ borderBottom: '1px solid var(--surface-3)', paddingBottom: '16px' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{rep.rep}</span>
                    <span className="text-sm font-bold" style={{ color: statusColor(rep.rate) }}>{rep.rate}%</span>
                  </div>
                  <div className="w-full rounded-full h-2.5 mb-2 overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(rep.rate, 100)}%`, backgroundColor: 'var(--secondary-500)' }}/>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--secondary-600)' }}>已出貨 {fmt(rep.totalShipped)}K</span>
                    <span style={{ color: 'var(--accent-purple-500)' }}>預測 {fmt(rep.totalForecast)}K</span>
                    <span>目標 {fmt(rep.totalTarget)}K</span>
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>案件數 {rep.caseCount}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="chart-section">
            <h2 className="section-title">
              <span style={{ color: 'var(--secondary-500)' }}>{icons.building}</span>
              經銷商排名（依已出貨）
            </h2>
            <div className="space-y-1">
              {data.dealerStats.map((d, i) => (
                <a key={d.dealer} href={`/cases?stage=已出貨&dealer=${encodeURIComponent(d.dealer)}`}
                  className="dealer-item flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg transition group" style={{ color: 'var(--text-primary)' }}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    i === 0 ? '' : i === 1 ? '' : i === 2 ? '' : ''
                  }`} style={{ backgroundColor: i === 0 ? 'var(--accent-yellow-500)' : i === 1 ? 'var(--text-tertiary)' : i === 2 ? 'var(--accent-yellow-700)' : 'var(--surface-300)' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.dealer}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--secondary-600)', fontWeight: 600 }}>{fmt(d.shipped)}K</span> · {d.caseCount} 件
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-disabled)' }} className="group-hover:text-primary transition">{icons.arrow}</span>
                </a>
              ))}
            </div>
          </section>
        </div>

        {/* Stage Distribution */}
        <section className="chart-section">
          <h2 className="section-title">
            <span style={{ color: 'var(--text-tertiary)' }}>{icons.grid}</span>
            案件階段分布
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.stageStats.map(s => {
              const configs: Record<string, { bg: string; border: string; text: string }> = {
                '進行中': { bg: 'var(--accent-orange-50)', border: 'var(--accent-orange-200)', text: 'var(--accent-orange-600)' },
                '待出貨': { bg: 'var(--accent-yellow-50)', border: 'var(--accent-yellow-200)', text: 'var(--accent-yellow-600)' },
                '已出貨': { bg: 'var(--secondary-50)', border: 'var(--secondary-200)', text: 'var(--secondary-600)' },
                '失敗': { bg: 'var(--surface-2)', border: 'var(--surface-300)', text: 'var(--text-secondary)' },
              }
              const c = configs[s.stage] || configs['失敗']
              return (
                <a key={s.stage} href={`/cases?stage=${encodeURIComponent(s.stage)}`}
                  className="block p-4 rounded-xl border transition-all hover:shadow-sm" style={{
                    backgroundColor: c.bg,
                    borderColor: c.border
                  }}>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{s.stage}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: c.text }}>{s.count}</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{fmt(s.amount)}K</div>
                </a>
              )
            })}
          </div>
        </section>

        <footer className="text-center text-xs mt-8 pb-6" style={{ color: 'var(--text-tertiary)' }}>
          Aurotek Sales Portal · Powered by Jarvis
        </footer>
      </main>
    </div>
  )
}
