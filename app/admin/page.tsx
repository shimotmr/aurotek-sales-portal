'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

import { 
  icons, 
  ADMIN_MENU_ITEMS, 
  ADMIN_GROUP_LABELS,
  type AdminItem 
} from '@/lib/menu-config'

interface Stats {
  teamCount: number
  annualTarget: number
  dealerCount: number
  caseCount: number
}

export default function AdminPage() {
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
    { label: '業務人員', value: stats.teamCount, color: '#3B82F6', bg: 'var(--primary-50)', darkBg: 'var(--primary-900)' },
    { label: '年度目標', value: stats.annualTarget.toLocaleString('zh-TW'), color: '#10B981', bg: 'var(--secondary-50)', darkBg: 'var(--secondary-900)' },
    { label: '經銷商', value: stats.dealerCount, color: '#8B5CF6', bg: 'var(--accent-purple-500)', darkBg: 'var(--accent-purple-900)' },
    { label: '案件數', value: stats.caseCount, color: '#F97316', bg: 'var(--accent-orange-500)', darkBg: 'var(--accent-orange-900)' },
  ]

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--surface-0)' }}
    >
      {/* Page Header */}
      <header 
        className="sticky top-0 z-10 backdrop-blur-sm"
        style={{ 
          backgroundColor: 'var(--surface-0)', 
          borderBottom: '1px solid var(--surface-3)' 
        }}
      >
        <div 
          className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, var(--text-secondary), var(--text-primary))' 
              }}
            >
              <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
            </div>
            <span 
              className="font-bold text-sm sm:text-base"
              style={{ color: 'var(--text-primary)' }}
            >
              後台管理
            </span>
          </div>
          <div 
            className="flex items-center gap-3 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="hidden sm:inline">{currentUser?.name}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Stats */}
        <section className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map(s => (
              <div 
                key={s.label} 
                className="rounded-xl p-4"
                style={{ 
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--surface-3)'
                }}
              >
                <div 
                  className="text-2xl font-bold"
                  style={{ color: s.color }}
                >
                  {isLoadingStats ? '—' : s.value}
                </div>
                <div 
                  className="text-xs mt-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Menu Groups */}
        {(['core', 'content', 'system'] as const).map(group => {
          const items = ADMIN_MENU_ITEMS.filter(i => i.group === group && (!i.superOnly || isSuperAdmin))
          if (!items.length) return null

          return (
            <section key={group} className="mb-6">
              <h2 
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {ADMIN_GROUP_LABELS[group]}
              </h2>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--surface-3)'
                }}
              >
                {items.map((item, index) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className="flex items-center gap-4 px-4 py-3.5 transition group"
                    style={{ 
                      borderBottom: index < items.length - 1 ? '1px solid var(--surface-3)' : 'none'
                    }}
                  >
                    <style jsx>{`
                      .flex.items-center.gap-4:hover {
                        background-color: var(--surface-hover);
                      }
                    `}</style>
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ 
                        background: item.color + '15', 
                        color: item.color 
                      }}
                    >
                      {icons[item.icon]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.title}
                      </div>
                      <div 
                        className="text-xs truncate"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {item.desc}
                      </div>
                    </div>
                    <svg 
                      className="w-4 h-4 shrink-0 transition" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        <footer 
          className="text-center text-xs mt-6 pb-6"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Aurotek Admin · Powered by Jarvis 🤖
        </footer>
      </div>
    </div>
  )
}
