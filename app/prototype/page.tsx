'use client'

import { Home, ClipboardList, Package, User, FileText, Mic, Bot, BarChart3, Image, DollarSign, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

import { supabase } from '@/lib/supabase'


// Types
interface CaseItem {
  id: string
  stage: string
  dealer: string
  end_customer: string | null
  machine: string | null
  amount: number
  expected: number
  updated_at: string
  rep: string
}

interface TargetData {
  rep_name: string
  target_amount: number
}

// Tab Bar for mobile
const TABS = [
  { id: 'home', title: '首頁', href: '/prototype', icon: <Home size={20} /> },
  { id: 'cases', title: '案件', href: '/cases', icon: <ClipboardList size={20} /> },
  { id: 'products', title: '資源', href: '/products', icon: <Package size={20} /> },
  { id: 'me', title: '我的', href: '/admin', icon: <User size={20} /> },
]

// Quick actions
const QUICK_ACTIONS = [
  { icon: <FileText size={20} />, label: '新報價', href: '/quotations' },
  { icon: <ClipboardList size={20} />, label: '新案件', href: '/cases' },
  { icon: <Mic size={20} />, label: '逐字稿', href: '/transcripts' },
  { icon: <Bot size={20} />, label: 'AI 助手', href: '/agents' },
  { icon: <BarChart3 size={20} />, label: '業績', href: '/performance' },
  { icon: <Image size={20} />, label: '資源庫', href: '/marketing' },
]

function formatAmount(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + '萬'
  return num.toLocaleString('zh-TW')
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return '剛剛'
  if (diff < 3600) return Math.floor(diff / 60) + '分鐘前'
  if (diff < 86400) return Math.floor(diff / 3600) + '小時前'
  return Math.floor(diff / 86400) + '天前'
}

const stageConfig: Record<string, { color: string; bg: string }> = {
  '進行中': { color: 'text-orange-600', bg: 'bg-orange-100' },
  '待出貨': { color: 'text-yellow-600', bg: 'bg-yellow-100' },
  '已出貨': { color: 'text-green-600', bg: 'bg-green-100' },
  '失敗': { color: 'text-gray-500', bg: 'bg-gray-100' },
}

export default function PrototypePage() {
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [cases, setCases] = useState<CaseItem[]>([])
  const [caseCount, setCaseCount] = useState(0)
  const [activeCaseCount, setActiveCaseCount] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [targetAmount, setTargetAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('早安')
    else if (hour < 18) setGreeting('午安')
    else setGreeting('晚安')
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        // Fetch all in parallel
        const [countRes, activeRes, casesRes, targetsRes] = await Promise.all([
          // Total case count
          supabase.from('cases').select('*', { count: 'exact', head: true }),
          // Active cases (進行中)
          supabase.from('cases').select('*', { count: 'exact', head: true }).eq('stage', '進行中'),
          // Recent cases
          supabase.from('cases')
            .select('id, stage, dealer, end_customer, machine, amount, expected, updated_at, rep')
            .order('updated_at', { ascending: false })
            .limit(10),
          // This month targets
          supabase.from('targets')
            .select('rep_name, target_amount')
            .eq('year', year)
            .eq('month', month),
        ])

        setCaseCount(countRes.count || 0)
        setActiveCaseCount(activeRes.count || 0)
        setCases(casesRes.data || [])

        // Sum up targets
        const targets = (targetsRes.data || []) as TargetData[]
        setTargetAmount(targets.reduce((sum, t) => sum + Number(t.target_amount), 0))

        // Sum active case amounts as "pipeline"
        const { data: amountData } = await supabase
          .from('cases')
          .select('expected')
          .eq('stage', '進行中')
        const total = (amountData || []).reduce((sum, c) => sum + Number(c.expected), 0)
        setTotalAmount(total)
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredCases = search
    ? cases.filter(c =>
        c.id.includes(search) ||
        c.dealer?.toLowerCase().includes(search.toLowerCase()) ||
        c.end_customer?.toLowerCase().includes(search.toLowerCase()) ||
        c.machine?.toLowerCase().includes(search.toLowerCase())
      )
    : cases

  const achievementRate = targetAmount > 0 ? Math.round((totalAmount / targetAmount) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-sm">{greeting} 👋</p>
            <h1 className="text-xl font-bold">Aurotek Portal</h1>
          </div>
          <Link href="/admin" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <User size={20} />
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="搜尋案件、客戶、產品..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/20 backdrop-blur-sm text-white placeholder-blue-200 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <svg className="absolute left-3 top-3.5 w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm">{greeting} 👋</p>
            <h1 className="text-2xl font-bold text-slate-800">首頁 Dashboard</h1>
          </div>
          <div className="relative w-80">
            <input
              type="text"
              placeholder="搜尋案件、客戶、產品..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white border border-transparent focus:border-blue-200"
            />
            <svg className="absolute left-3 top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 -mt-4 md:mt-6 relative z-10">
          {/* Pipeline Amount */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg shadow-blue-500/5 border border-white/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm"><DollarSign size={16} /></div>
              <span className="text-xs text-slate-500">Pipeline</span>
            </div>
            {loading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-slate-800">{formatAmount(totalAmount)}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">進行中案件金額</p>
          </div>

          {/* Achievement Rate */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg shadow-green-500/5 border border-white/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-sm">🎯</div>
              <span className="text-xs text-slate-500">達成率</span>
            </div>
            {loading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-slate-800">{achievementRate}%</p>
            )}
            {!loading && targetAmount > 0 && (
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(achievementRate, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Active Cases */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg shadow-orange-500/5 border border-white/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm">🔥</div>
              <span className="text-xs text-slate-500">進行中</span>
            </div>
            {loading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-slate-800">{activeCaseCount}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">件案件</p>
          </div>

          {/* Total Cases */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg shadow-purple-500/5 border border-white/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm"><BarChart3 size={16} /></div>
              <span className="text-xs text-slate-500">總案件</span>
            </div>
            {loading ? (
              <div className="h-7 bg-slate-100 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-slate-800">{caseCount}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">本期案件總數</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap size={16} /> 快捷入口
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {QUICK_ACTIONS.map(action => (
              <Link
                key={action.label}
                href={action.href}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all min-w-[72px]"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs text-slate-600 font-medium whitespace-nowrap">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Cases */}
        <div className="mt-6 mb-24">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <ClipboardList size={16} /> 待處理案件
            </h2>
            <Link href="/cases" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              查看全部 →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCases.slice(0, 8).map(c => {
                const stage = stageConfig[c.stage] || { color: 'text-slate-600', bg: 'bg-slate-100' }
                return (
                  <Link
                    key={c.id}
                    href={`/cases?search=${c.id}`}
                    className="block bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-800 truncate">{c.dealer}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stage.bg} ${stage.color}`}>
                            {c.stage}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {c.end_customer || c.machine || c.id}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{c.rep} · {timeAgo(c.updated_at)}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-bold text-slate-700">{formatAmount(c.expected)}</p>
                        <p className="text-[10px] text-slate-400">預估金額</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
              {filteredCases.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {search ? '找不到符合條件的案件' : '目前沒有案件資料'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note: 底部導航已移除，現在由 AppShell 的側邊欄/漢堡選單統一處理 */}
    </div>
  )
}
