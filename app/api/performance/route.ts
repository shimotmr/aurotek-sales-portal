import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Fetch all data in parallel
    const [casesRes, targetsRes, teamRes] = await Promise.all([
      supabase.from('cases').select('*'),
      supabase.from('targets').select('*').eq('year', currentYear),
      supabase.from('team').select('*'),
    ])

    if (casesRes.error) throw casesRes.error
    if (targetsRes.error) throw targetsRes.error
    if (teamRes.error) throw teamRes.error

    const cases = casesRes.data || []
    const targets = targetsRes.data || []
    const team = teamRes.data || []

    // --- Monthly Stats ---
    const monthlyStats = []
    for (let m = 1; m <= 12; m++) {
      const monthTarget = targets
        .filter(t => t.month === m)
        .reduce((sum, t) => sum + (Number(t.target_amount) || 0), 0)

      const monthCases = cases.filter(c => {
        const d = c.ship_date || c.order_date
        if (!d) return false
        const dt = new Date(d)
        return dt.getFullYear() === currentYear && dt.getMonth() + 1 === m
      })

      const shipped = monthCases
        .filter(c => c.stage === '已出貨')
        .reduce((sum, c) => sum + (c.amount || 0), 0)

      const forecast = monthCases
        .filter(c => c.stage === '進行中' || c.stage === '待出貨')
        .reduce((sum, c) => sum + ((c.amount || 0) * (c.probability || 0) / 100), 0)

      const isActual = m <= currentMonth
      const effective = isActual ? shipped : shipped + forecast
      const gap = effective - monthTarget
      const rate = monthTarget > 0 ? Math.round((effective / monthTarget) * 100) : 0

      monthlyStats.push({
        month: m,
        actual: Math.round(shipped),
        forecast: Math.round(forecast),
        target: Math.round(monthTarget),
        gap: Math.round(gap),
        rate,
        type: isActual ? 'actual' : 'forecast',
      })
    }

    // --- YTD ---
    const ytdShipped = monthlyStats
      .filter(ms => ms.month <= currentMonth)
      .reduce((sum, ms) => sum + ms.actual, 0)
    const ytdTarget = monthlyStats
      .filter(ms => ms.month <= currentMonth)
      .reduce((sum, ms) => sum + ms.target, 0)

    const thisMonth = monthlyStats.find(ms => ms.month === currentMonth)!

    // --- Summary ---
    const activeCases = cases.filter(c => c.stage === '進行中' || c.stage === '待出貨').length
    const summary = {
      totalCases: cases.length,
      activeCases,
      thisMonth: {
        month: currentMonth,
        actual: thisMonth.actual,
        forecast: thisMonth.forecast,
        target: thisMonth.target,
        gap: thisMonth.gap,
        rate: thisMonth.rate,
        type: thisMonth.type,
      },
      ytd: {
        shipped: ytdShipped,
        target: ytdTarget,
        rate: ytdTarget > 0 ? Math.round((ytdShipped / ytdTarget) * 100) : 0,
      },
    }

    // --- Rep Stats ---
    const repMap = new Map<string, { shipped: number; forecast: number; target: number; count: number }>()
    for (const c of cases) {
      const rep = c.rep || '未指定'
      if (!repMap.has(rep)) repMap.set(rep, { shipped: 0, forecast: 0, target: 0, count: 0 })
      const r = repMap.get(rep)!
      r.count++
      if (c.stage === '已出貨') r.shipped += (c.amount || 0)
      if (c.stage === '進行中' || c.stage === '待出貨') {
        r.forecast += (c.amount || 0) * (c.probability || 0) / 100
      }
    }
    // Add targets per rep
    for (const t of targets) {
      const repName = t.rep_name || '未指定'
      if (!repMap.has(repName)) repMap.set(repName, { shipped: 0, forecast: 0, target: 0, count: 0 })
      repMap.get(repName)!.target += (Number(t.target_amount) || 0)
    }
    const repStats = Array.from(repMap.entries()).map(([rep, v]) => ({
      rep,
      totalShipped: Math.round(v.shipped),
      totalForecast: Math.round(v.forecast),
      totalTarget: Math.round(v.target),
      rate: v.target > 0 ? Math.round((v.shipped / v.target) * 100) : 0,
      caseCount: v.count,
    })).sort((a, b) => b.totalShipped - a.totalShipped)

    // --- Dealer Stats ---
    const dealerMap = new Map<string, { shipped: number; count: number }>()
    for (const c of cases) {
      const dealer = c.dealer || '未指定'
      if (!dealerMap.has(dealer)) dealerMap.set(dealer, { shipped: 0, count: 0 })
      const d = dealerMap.get(dealer)!
      if (c.stage === '已出貨') d.shipped += (c.amount || 0)
      d.count++
    }
    const dealerStats = Array.from(dealerMap.entries())
      .map(([dealer, v]) => ({
        dealer,
        shipped: Math.round(v.shipped),
        caseCount: v.count,
      }))
      .sort((a, b) => b.shipped - a.shipped)

    // --- Stage Stats ---
    const stageMap = new Map<string, { count: number; amount: number }>()
    for (const c of cases) {
      const stage = c.stage || '未指定'
      if (!stageMap.has(stage)) stageMap.set(stage, { count: 0, amount: 0 })
      const s = stageMap.get(stage)!
      s.count++
      s.amount += (c.amount || 0)
    }
    const stageOrder = ['進行中', '待出貨', '已出貨', '失敗']
    const stageStats = stageOrder.map(stage => ({
      stage,
      count: stageMap.get(stage)?.count || 0,
      amount: Math.round(stageMap.get(stage)?.amount || 0),
    }))

    return NextResponse.json({
      summary,
      monthlyStats,
      repStats,
      dealerStats,
      stageStats,
      updatedAt: now.toISOString(),
      currentMonth,
    })
  } catch (error) {
    console.error('Performance API Error:', error)
    return NextResponse.json({
      summary: {
        totalCases: 0,
        activeCases: 0,
        thisMonth: { month: new Date().getMonth() + 1, actual: 0, forecast: 0, target: 0, gap: 0, rate: 0, type: 'actual' },
        ytd: { shipped: 0, target: 0, rate: 0 },
      },
      monthlyStats: [],
      repStats: [],
      dealerStats: [],
      stageStats: [],
      updatedAt: new Date().toISOString(),
      currentMonth: new Date().getMonth() + 1,
      error: 'Failed to fetch data from Supabase',
    })
  }
}
