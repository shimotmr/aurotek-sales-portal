'use client'

import { Smartphone, Search, ClipboardList } from 'lucide-react'
import Link from 'next/link'

import { icons, MARKETING_MENU_ITEMS } from '@/lib/menu-config'

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
          {MARKETING_MENU_ITEMS.map(item => (
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

        <p className="text-center text-xs text-slate-400 mt-8 flex items-center justify-center gap-1"><Smartphone size={14} /> 支援手機瀏覽 · <Search size={14} /> 關鍵字搜尋 · <ClipboardList size={14} /> 播放清單功能</p>
      </div>
    </div>
  )
}
