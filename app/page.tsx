'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

import UserMenu from './components/UserMenu'

import { 
  icons, 
  PORTAL_MENU_ITEMS, 
  PORTAL_GROUP_LABELS, 
  PORTAL_STATUS_BADGE,
  type MenuItem 
} from '@/lib/menu-config'
import { supabase } from '@/lib/supabase'

// Gradient card color mapping per spec
const cardGradients: Record<string, { light: string; dark?: string }> = {
  performance: { light: 'linear-gradient(135deg, #ff6b6b, #ee5a24)' },
  products: { light: 'linear-gradient(135deg, #4ecdc4, #44bd32)' },
  quotations: { light: 'linear-gradient(135deg, #45b7d1, #3742fa)' },
  transcripts: { light: 'linear-gradient(135deg, #9c88ff, #7209b7)' },
  marketing: { light: 'linear-gradient(135deg, #feca57, #ff9ff3)' },
  knowledge: { light: 'linear-gradient(135deg, #a855f7, #ec4899)' },
  samples: { light: 'linear-gradient(135deg, #f59e0b, #eab308)' },
  agents: { light: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' },
  admin: { light: 'linear-gradient(135deg, #64748b, #475569)', dark: 'linear-gradient(135deg, #475569, #334155)' },
}

export default function Home() {
  const [greeting, setGreeting] = useState('')
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Get theme from localStorage or system preference
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = stored || (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

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

  // Get gradient style for a card
  const getCardGradient = (id: string) => {
    const gradient = cardGradients[id]
    if (!gradient) return 'linear-gradient(135deg, #64748b, #475569)'
    if (theme === 'dark' && gradient.dark) return gradient.dark
    return gradient.light
  }

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: 'var(--surface-0)' }}>
      {/* Header */}
      <header className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-white">
                <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 10l8 5 8-5"/>
              </svg>
            </div>
            <span className="font-bold text-lg md:text-xl" style={{ color: 'var(--text-primary)' }}>和椿通路營業系統</span>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Greeting Section */}
      <section className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {greeting}{userName ? <span className="font-normal" style={{ color: 'var(--primary-500)' }}>，{userName}</span> : ''} 👋
        </h1>
        <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>需要什麼幫助？選擇下方功能開始</p>
      </section>

      {/* Grouped Modules */}
      {groups.map(group => {
        const items = visibleItems.filter(i => i.group === group)
        if (items.length === 0) return null
        const { label, desc } = PORTAL_GROUP_LABELS[group]

        return (
          <section key={group} className="mb-6 md:mb-8">
            <div className="mb-4">
              <h2 className="text-lg md:text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</h2>
              <span className="text-xs md:text-sm" style={{ color: 'var(--text-tertiary)' }}>{desc}</span>
            </div>
            
            <div className={`grid gap-3 md:gap-4 ${group === 'system' ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {items.map(item => {
                const badge = PORTAL_STATUS_BADGE[item.status]
                const isSoon = item.status === 'soon'
                const gradientStyle = { background: getCardGradient(item.id) }

                return (
                  <Link
                    key={item.id}
                    href={isSoon ? '#' : item.href}
                    className={`relative overflow-hidden rounded-2xl p-4 md:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group ${isSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={gradientStyle}
                    onClick={isSoon ? (e) => e.preventDefault() : undefined}
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-white/10 pointer-events-none" />

                    {/* Status badge */}
                    {badge.label && (
                      <span className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}

                    {/* Icon */}
                    <div className="mb-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <span className="[&>*]:w-6 [&>*]:h-6 [&>*]:text-white">
                          {icons[item.icon]}
                        </span>
                      </div>
                    </div>

                    {/* Text */}
                    <div className="text-white">
                      <h3 className="font-bold text-base md:text-lg mb-1">{item.title}</h3>
                      <p className="text-xs md:text-sm text-white/80 line-clamp-2">{item.desc}</p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Footer */}
      <footer className="text-center py-6 text-xs md:text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Aurotek Sales Portal · Powered by Jarvis 🤖
      </footer>
    </main>
  )
}
