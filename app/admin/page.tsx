'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Stats {
  teamCount: number
  annualTarget: number
  dealerCount: number
  caseCount: number
}

// SVG Icons
const icons = {
  target: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2"/>
      <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
      <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
    </svg>
  ),
  team: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <circle cx="16" cy="11" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="25" cy="13" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <path d="M26 20c2 .8 3.5 2.8 3.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  dealer: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <rect x="4" y="14" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M4 18h24" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <path d="M10 6h12l4 8H6l4-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="13" y="22" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  video: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <rect x="3" y="7" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M23 13l6-3v12l-6-3v-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="13" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  ),
  slides: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <rect x="4" y="4" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 22v6M10 28h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 10h12M10 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  sync: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <path d="M6 16a10 10 0 0117.3-6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 16a10 10 0 01-17.3 6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 6l2 4-4 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 26l-2-4 4-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  logs: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M11 10h10M11 15h10M11 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <circle cx="11" cy="10" r="1" fill="currentColor"/>
      <circle cx="11" cy="15" r="1" fill="currentColor"/>
      <circle cx="11" cy="20" r="1" fill="currentColor"/>
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <path d="M16 4l2 5h5l-4 3 1.5 5L16 14l-4.5 3L13 12 9 9h5l2-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="16" cy="24" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 20v-3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
}

interface AdminItem {
  title: string
  desc: string
  href: string
  icon: keyof typeof icons
  color: string
  group: 'core' | 'content' | 'system'
  superOnly?: boolean
}

const ITEMS: AdminItem[] = [
  { title: '目標管理', desc: '年度 · 月度 · 個人目標設定', href: '/admin/targets', icon: 'target', color: '#3B82F6', group: 'core' },
  { title: '業務團隊', desc: '業務員資料 · 職責分配', href: '/admin/team', icon: 'team', color: '#10B981', group: 'core' },
  { title: '經銷商管理', desc: '經銷商資料 · 聯絡人 · 區域', href: '/admin/dealers', icon: 'dealer', color: '#8B5CF6', group: 'core' },
  { title: '影片管理', desc: '案例影片 · 分類 · 連結', href: '/admin/videos', icon: 'video', color: '#EF4444', group: 'content' },
  { title: '簡報管理', desc: '簡報範本 · 分類 · 權限', href: '/admin/slides', icon: 'slides', color: '#F59E0B', group: 'content' },
  { title: '資料同步', desc: 'Funnel 報表上傳 · 資料匯入', href: '/admin/sync', icon: 'sync', color: '#F97316', group: 'system' },
  { title: '系統日誌', desc: '登入紀錄 · 操作紀錄 · 錯誤', href: '/admin/logs', icon: 'logs', color: '#06B6D4', group: 'system' },
  { title: '管理員管理', desc: '新增 · 移除管理員帳號', href: '/admin/admins', icon: 'admin', color: '#EC4899', group: 'system', superOnly: true },
]

const GROUPS: Record<string, string> = {
  core: '營業管理',
  content: '內容管理',
  system: '系統設定',
}

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [stats, setStats] = useState<Stats>({ teamCount: 0, annualTarget: 0, dealerCount: 0, caseCount: 0 })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '')
      return ''
    }
    const userName = getCookie('user_name')
    const userEmail = getCookie('user_email')
    const superAdmin = getCookie('is_super_admin') === 'true'
    if (userName && userEmail) { setCurrentUser({ name: userName, email: userEmail }); setIsSuperAdmin(superAdmin) }
    loadStats()
  }, [])

  const loadStats = async () => {
    setIsLoadingStats(true)
    try {
      const currentYear = new Date().getFullYear()
      const [teamRes, targetsRes, dealersRes, casesRes] = await Promise.all([
        fetch('/api/team'), fetch(`/api/targets?year=${currentYear}`), fetch('/api/dealers'), fetch('/api/cases')
      ])
      const [teamData, targetsData, dealersData, casesData] = await Promise.all([teamRes.json(), targetsRes.json(), dealersRes.json(), casesRes.json()])
      setStats({
        teamCount: teamData.success ? (teamData.data?.filter((t: any) => t.status === 'active')?.length || 0) : 0,
        annualTarget: targetsData.success ? (targetsData.data?.reduce((s: number, t: any) => s + (t.targetAmount || 0), 0) || 0) : 0,
        dealerCount: dealersData.success ? (dealersData.data?.filter((d: any) => d.status === 'active')?.length || 0) : 0,
        caseCount: casesData.success ? (casesData.data?.length || 0) : 0,
      })
    } catch (e) { console.error('Failed to load stats:', e) }
    finally { setIsLoadingStats(false) }
  }

  const statCards = [
    { label: '業務人員', value: stats.teamCount, color: '#3B82F6', bg: '#EFF6FF' },
    { label: '年度目標', value: stats.annualTarget.toLocaleString('zh-TW'), color: '#10B981', bg: '#ECFDF5' },
    { label: '經銷商', value: stats.dealerCount, color: '#8B5CF6', bg: '#F5F3FF' },
    { label: '案件數', value: stats.caseCount, color: '#F97316', bg: '#FFF7ED' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-sm sm:text-base">後台管理</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 hidden sm:inline">{currentUser?.name}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Stats */}
        <section className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <div className="text-2xl font-bold" style={{ color: s.color }}>
                  {isLoadingStats ? '—' : s.value}
                </div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Menu Groups */}
        {(['core', 'content', 'system'] as const).map(group => {
          const items = ITEMS.filter(i => i.group === group && (!i.superOnly || isSuperAdmin))
          if (!items.length) return null

          return (
            <section key={group} className="mb-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{GROUPS[group]}</h2>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                {items.map(item => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: item.color + '12', color: item.color }}>
                      {icons[item.icon]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                      <div className="text-xs text-slate-400 truncate">{item.desc}</div>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        <footer className="text-center text-xs text-slate-400 mt-6 pb-6">
          Aurotek Admin · Powered by Jarvis 🤖
        </footer>
      </div>
    </div>
  )
}
