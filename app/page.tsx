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
    <main className="home-layout">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 10l8 5 8-5"/>
              </svg>
            </div>
            <span className="logo-text">和椿通路營業系統</span>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Greeting Section */}
      <section className="greeting-section">
        <h1 className="greeting-title">
          {greeting}{userName ? <span className="greeting-name">，{userName}</span> : ''} 👋
        </h1>
        <p className="greeting-subtitle">需要什麼幫助？選擇下方功能開始</p>
      </section>

      {/* Grouped Modules */}
      {groups.map(group => {
        const items = visibleItems.filter(i => i.group === group)
        if (items.length === 0) return null
        const { label, desc } = PORTAL_GROUP_LABELS[group]

        return (
          <section key={group} className="module-section">
            <div className="section-header">
              <h2 className="section-title">{label}</h2>
              <span className="section-desc">{desc}</span>
            </div>
            
            <div className={`feature-grid ${group === 'system' ? 'grid-cols-2' : ''}`}>
              {items.map(item => {
                const badge = PORTAL_STATUS_BADGE[item.status]
                const isSoon = item.status === 'soon'
                const gradientStyle = { background: getCardGradient(item.id) }

                return (
                  <Link
                    key={item.id}
                    href={isSoon ? '#' : item.href}
                    className={`feature-card ${isSoon ? 'card-disabled' : ''}`}
                    style={gradientStyle}
                    onClick={isSoon ? (e) => e.preventDefault() : undefined}
                  >
                    {/* Gradient overlay */}
                    <div className="card-overlay" />

                    {/* Status badge */}
                    {badge.label && (
                      <span className={`status-badge ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}

                    {/* Icon */}
                    <div className="card-icon">
                      <div className="icon-container">
                        <span className="[&>*]:w-6 [&>*]:h-6 [&>*]:text-white">
                          {icons[item.icon]}
                        </span>
                      </div>
                    </div>

                    {/* Text */}
                    <div className="card-content">
                      <h3 className="card-title">{item.title}</h3>
                      <p className="card-desc">{item.desc}</p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="card-arrow">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
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
      <footer className="home-footer">
        Aurotek Sales Portal · Powered by Jarvis 🤖
      </footer>
    </main>
  )
}
