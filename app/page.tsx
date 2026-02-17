'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

import { MobileTabBar } from './components/AppShell'
import UserMenu from './components/UserMenu'

import { 
  icons, 
  PORTAL_MENU_ITEMS, 
  PORTAL_GROUP_LABELS, 
  PORTAL_STATUS_BADGE,
  type MenuItem 
} from '@/lib/menu-config'
import { supabase } from '@/lib/supabase'

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

    const nameCookie = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('user_name='))
    const employeeId = nameCookie ? decodeURIComponent(nameCookie.split('=')[1]).split('@')[0] : ''
    if (employeeId) {
      setUserName(employeeId)
      // 從 portal_admins 查別名，再從 employees 查姓名+職稱
      Promise.all([
        fetch(`/api/employees/lookup?employee_id=${encodeURIComponent(employeeId)}`).then(r => r.ok ? r.json() : null).catch(() => null),
        supabase.from('portal_admins').select('nickname, name, title').or(`employee_id.eq.${employeeId},email.ilike.${employeeId}@%`).maybeSingle().then(r => r.data),
      ]).then(([emp, admin]) => {
        const displayName = admin?.nickname || admin?.name || emp?.name || employeeId
        const title = emp?.title || admin?.title || ''
        setUserName(title ? `${displayName} ${title}` : displayName)
      })
    }

    const admin = document.cookie.split(';').some(c => c.trim().startsWith('is_admin=true'))
    setIsAdmin(admin)
  }, [])

  const groups = ['sales', 'tools', 'system'] as const
  const visibleItems = PORTAL_MENU_ITEMS.filter(item => {
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
          const { label, desc } = PORTAL_GROUP_LABELS[group]

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
                  const badge = PORTAL_STATUS_BADGE[item.status]
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
        <footer className="text-center text-xs text-slate-400 mt-8 pb-20 md:pb-6">
          Aurotek Sales Portal · Powered by Jarvis 🤖
        </footer>
      </div>

      {/* Mobile Tab Bar */}
      <MobileTabBar />
    </main>
  )
}
