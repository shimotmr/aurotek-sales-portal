'use client'

import Link from 'next/link'

const icons = {
  video: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <rect x="3" y="7" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M23 13l6-3v12l-6-3v-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="13" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  ),
  slides: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <rect x="4" y="4" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 22v6M10 28h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 10h12M10 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  robot: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <rect x="8" y="10" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="14" cy="17" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="20" cy="17" r="2" fill="currentColor" opacity="0.6"/>
      <path d="M16 6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="5" r="1.5" fill="currentColor"/>
      <path d="M5 16h3M24 16h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
}

const ITEMS = [
  {
    title: '影片案例',
    desc: '產品演示 · 客戶案例 · 官方宣傳',
    sub: 'YouTube 影片 · 分類瀏覽 · 關鍵字搜尋',
    href: '/marketing/videos',
    icon: 'video' as const,
    color: '#EF4444',
  },
  {
    title: '簡報案例',
    desc: '產品簡報 · 方案提案 · 技術文件',
    sub: 'Google Slides · 播放清單 · 依序播放',
    href: '/marketing/slides',
    icon: 'slides' as const,
    color: '#F59E0B',
  },
  {
    title: 'Walker 天工文檔',
    desc: 'Walker 機器人技術文檔 · SDK',
    sub: 'UBTECH · 用戶手冊 · SDK 文檔',
    href: '/marketing/walker-docs',
    icon: 'robot' as const,
    color: '#8B5CF6',
  },
]

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Page Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 md:top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
          </div>
          <span className="font-bold text-slate-800 text-sm sm:text-base">數位資源庫</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">數位資源庫</h1>
          <p className="text-slate-500 mt-1 text-sm">影片案例、簡報資源、技術文檔</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {ITEMS.map(item => (
            <Link key={item.href} href={item.href}
              className="group block rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: item.color + '12', color: item.color }}>
                {icons[item.icon]}
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-snug">{item.desc}</p>
              <p className="text-xs text-slate-400 mt-2">{item.sub}</p>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">📱 支援手機瀏覽 · 🔍 關鍵字搜尋 · 📋 播放清單功能</p>
      </div>
    </div>
  )
}
