'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import UserMenu from './components/UserMenu'

// SVG Icons as components — clean, consistent, scalable
const icons = {
  pipeline: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="4" y="28" width="6" height="8" rx="1" fill="#93C5FD"/>
      <rect x="13" y="20" width="6" height="16" rx="1" fill="#60A5FA"/>
      <rect x="22" y="14" width="6" height="22" rx="1" fill="#3B82F6"/>
      <rect x="31" y="6" width="6" height="30" rx="1" fill="#1D4ED8"/>
      <path d="M7 26L16 18L25 12L34 5" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
    </svg>
  ),
  product: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="6" y="8" width="28" height="24" rx="3" stroke="#059669" strokeWidth="2"/>
      <circle cx="20" cy="18" r="5" stroke="#059669" strokeWidth="2"/>
      <line x1="14" y1="27" x2="26" y2="27" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 8V5a5 5 0 0110 0v3" stroke="#10B981" strokeWidth="2"/>
    </svg>
  ),
  quotation: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="8" y="4" width="24" height="32" rx="2" stroke="#EA580C" strokeWidth="2"/>
      <line x1="13" y1="12" x2="27" y2="12" stroke="#FB923C" strokeWidth="2" strokeLinecap="round"/>
      <line x1="13" y1="18" x2="24" y2="18" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13" y1="22" x2="22" y2="22" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13" y1="26" x2="20" y2="26" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 30l2 2 4-4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  transcript: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <circle cx="20" cy="14" r="6" stroke="#4F46E5" strokeWidth="2"/>
      <path d="M20 20v6" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 26a6 6 0 0012 0" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="34" x2="14" y2="34" stroke="#818CF8" strokeWidth="2" strokeLinecap="round"/>
      <line x1="17" y1="34" x2="26" y2="34" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="29" y1="34" x2="33" y2="34" stroke="#C7D2FE" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  agent: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="10" y="8" width="20" height="16" rx="4" stroke="#0891B2" strokeWidth="2"/>
      <circle cx="16" cy="16" r="2" fill="#06B6D4"/>
      <circle cx="24" cy="16" r="2" fill="#06B6D4"/>
      <path d="M15 28h10" stroke="#0891B2" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 24v4" stroke="#0891B2" strokeWidth="1.5"/>
      <path d="M22 24v4" stroke="#0891B2" strokeWidth="1.5"/>
      <path d="M6 12h4M30 12h4" stroke="#67E8F9" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="5" r="2" stroke="#0891B2" strokeWidth="1.5"/>
      <line x1="20" y1="7" x2="20" y2="8" stroke="#0891B2" strokeWidth="1.5"/>
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <circle cx="20" cy="20" r="7" stroke="#6B7280" strokeWidth="2"/>
      <circle cx="20" cy="20" r="2.5" fill="#9CA3AF"/>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 20 + 9 * Math.cos(rad)
        const y1 = 20 + 9 * Math.sin(rad)
        const x2 = 20 + 12 * Math.cos(rad)
        const y2 = 20 + 12 * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"/>
      })}
    </svg>
  ),
  marketing: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="6" y="10" width="18" height="20" rx="2" stroke="#7C3AED" strokeWidth="2"/>
      <circle cx="15" cy="18" r="3" stroke="#7C3AED" strokeWidth="1.5"/>
      <path d="M8 26l4-3 3 2 5-5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="20" y="6" width="14" height="10" rx="2" stroke="#A78BFA" strokeWidth="1.5"/>
      <path d="M24 9h6M24 12h4" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  samples: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <path d="M8 12l12-6 12 6v16l-12 6-12-6V12z" stroke="#D97706" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M8 12l12 6 12-6" stroke="#D97706" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M20 18v14" stroke="#D97706" strokeWidth="2"/>
      <path d="M14 9l12 6" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
    </svg>
  ),
}

interface MenuItem {
  id: string
  title: string
  desc: string
  href: string
  icon: keyof typeof icons
  gradient: string
  textColor: string
  status: 'live' | 'beta' | 'soon'
  group: 'sales' | 'tools' | 'system'
}

const MENU_ITEMS: MenuItem[] = [
  // 營業核心
  { id: 'performance', title: '業績管理', desc: 'Pipeline 追蹤 · 目標達成率 · 團隊績效', href: '/performance', icon: 'pipeline', gradient: 'from-blue-500 to-blue-600', textColor: 'text-blue-100', status: 'live', group: 'sales' },
  { id: 'products', title: '產品目錄', desc: '搜尋產品 · 牌價經銷價 · 即時庫存', href: '/products', icon: 'product', gradient: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-100', status: 'live', group: 'sales' },
  { id: 'quotations', title: '報價單', desc: '快速開立報價 · PDF 匯出 · 歷史查詢', href: '/quotations', icon: 'quotation', gradient: 'from-orange-500 to-orange-600', textColor: 'text-orange-100', status: 'beta', group: 'sales' },
  // 效率工具
  { id: 'transcripts', title: '會議逐字稿', desc: 'AI 語音轉文字 · 講者辨識 · 智慧校正', href: '/transcripts', icon: 'transcript', gradient: 'from-indigo-500 to-indigo-600', textColor: 'text-indigo-100', status: 'live', group: 'tools' },
  { id: 'marketing', title: '數位資源庫', desc: '產品影片 · 簡報範本 · 技術文件', href: '/marketing', icon: 'marketing', gradient: 'from-violet-500 to-violet-600', textColor: 'text-violet-100', status: 'live', group: 'tools' },
  { id: 'samples', title: '樣品借用', desc: '借出歸還追蹤 · 庫位管理', href: '/samples', icon: 'samples', gradient: 'from-amber-500 to-amber-600', textColor: 'text-amber-100', status: 'soon', group: 'tools' },
  // 系統管理
  { id: 'agents', title: 'Agent 中控台', desc: '多 Agent 狀態 · 任務監控 · 執行紀錄', href: '/agents', icon: 'agent', gradient: 'from-cyan-500 to-cyan-600', textColor: 'text-cyan-100', status: 'live', group: 'system' },
  { id: 'admin', title: '後台管理', desc: '目標設定 · 團隊管理 · 經銷商維護', href: '/admin', icon: 'admin', gradient: 'from-gray-600 to-gray-700', textColor: 'text-gray-300', status: 'live', group: 'system' },
]

const GROUP_LABELS: Record<string, { label: string; desc: string }> = {
  sales: { label: '營業核心', desc: '日常業務必備功能' },
  tools: { label: '效率工具', desc: '提升工作效率的輔助工具' },
  system: { label: '系統管理', desc: '管理員專用' },
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  live: { label: '', cls: '' },
  beta: { label: 'BETA', cls: 'bg-amber-400/90 text-amber-900' },
  soon: { label: '開發中', cls: 'bg-white/20 text-white/80' },
}

export default function Home() {
  const [greeting, setGreeting] = useState('')
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 6) setGreeting('夜深了')
    else if (hour < 12) setGreeting('早安')
    else if (hour < 18) setGreeting('午安')
    else setGreeting('晚安')

    const name = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('user_name='))
    if (name) setUserName(decodeURIComponent(name.split('=')[1]).split('@')[0])

    const admin = document.cookie.split(';').some(c => c.trim().startsWith('is_admin=true'))
    setIsAdmin(admin)
  }, [])

  const groups = ['sales', 'tools', 'system'] as const
  const visibleItems = MENU_ITEMS.filter(item => {
    if (item.group === 'system' && !isAdmin) return false
    return true
  })

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="white" className="w-4.5 h-4.5">
                <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 10l8 5 8-5"/>
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-sm sm:text-base">和椿通路營業系統</span>
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {greeting}{userName ? `，${userName}` : ''} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">需要什麼幫助？選擇下方功能開始</p>
        </div>

        {/* Grouped Modules */}
        {groups.map(group => {
          const items = visibleItems.filter(i => i.group === group)
          if (items.length === 0) return null
          const { label, desc } = GROUP_LABELS[group]

          return (
            <section key={group} className="mb-8">
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{label}</h2>
                <span className="text-xs text-slate-400 hidden sm:inline">{desc}</span>
              </div>
              <div className={`grid gap-3 sm:gap-4 ${
                group === 'system' ? 'grid-cols-2 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
              }`}>
                {items.map(item => {
                  const badge = STATUS_BADGE[item.status]
                  const isSoon = item.status === 'soon'

                  return (
                    <Link
                      key={item.id}
                      href={isSoon ? '#' : item.href}
                      className={`group relative block rounded-2xl bg-gradient-to-br ${item.gradient} p-4 sm:p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${
                        isSoon ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      onClick={isSoon ? (e) => e.preventDefault() : undefined}
                    >
                      {/* Status badge */}
                      {badge.label && (
                        <span className={`absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}

                      {/* Icon */}
                      <div className="mb-3 w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                        <div className="[&_svg]:w-7 [&_svg]:h-7 [&_line]:stroke-white [&_rect]:stroke-white [&_circle]:stroke-white [&_path]:stroke-white [&_circle[fill]]:fill-white/80 [&_rect[fill]]:fill-white/60">
                          {icons[item.icon]}
                        </div>
                      </div>

                      {/* Text */}
                      <h3 className="text-white font-bold text-base sm:text-lg leading-tight">{item.title}</h3>
                      <p className={`${item.textColor} text-xs sm:text-sm mt-1 leading-snug opacity-90`}>{item.desc}</p>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 mt-8 pb-6">
          Aurotek Sales Portal · Powered by Jarvis 🤖
        </footer>
      </div>
    </main>
  )
}
