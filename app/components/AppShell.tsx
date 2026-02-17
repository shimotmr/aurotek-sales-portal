'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import ThemeToggle from './ThemeToggle'

import { logActionWithIP } from '@/lib/audit'

// Navigation data
interface NavItem {
  id: string
  title: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// SVG Icons
const icons = {
  home: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
    </svg>
  ),
  performance: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
    </svg>
  ),
  products: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/>
    </svg>
  ),
  quotations: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
    </svg>
  ),
  transcripts: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
    </svg>
  ),
  marketing: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
    </svg>
  ),
  agents: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M13 7H7v6h6V7z"/>
      <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd"/>
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
    </svg>
  ),
  hamburger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
    </svg>
  ),
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: '快速功能',
    items: [
      { id: 'home', title: '首頁', href: '/', icon: icons.home },
    ]
  },
  {
    label: '營業核心',
    items: [
      { id: 'performance', title: '業績管理', href: '/performance', icon: icons.performance },
      { id: 'products', title: '產品目錄', href: '/products', icon: icons.products },
      { id: 'quotations', title: '報價單', href: '/quotations', icon: icons.quotations },
    ]
  },
  {
    label: '效率工具',
    items: [
      { id: 'transcripts', title: '會議逐字稿', href: '/transcripts', icon: icons.transcripts },
      { id: 'marketing', title: '數位資源庫', href: '/marketing', icon: icons.marketing },
    ]
  },
  {
    label: '系統管理',
    items: [
      { id: 'agents', title: 'Agent 中控台', href: '/agents', icon: icons.agents, adminOnly: true },
      { id: 'admin', title: '後台管理', href: '/admin', icon: icons.admin, adminOnly: true },
    ]
  }
]

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const lastLoggedPath = useRef('')

  useEffect(() => {
    // Read cookies
    const name = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('user_name='))
    if (name) setUserName(decodeURIComponent(name.split('=')[1]).split('@')[0])
    
    const admin = document.cookie.split(';').some(c => c.trim().startsWith('is_admin=true'))
    setIsAdmin(admin)
  }, [])

  // 管理員頁面瀏覽日誌
  useEffect(() => {
    if (isAdmin && pathname && pathname !== lastLoggedPath.current) {
      lastLoggedPath.current = pathname
      logActionWithIP('page_view', pathname, pathname)
    }
  }, [pathname, isAdmin])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleLogout = () => {
    document.cookie = 'user_name=; path=/; max-age=0'
    document.cookie = 'is_admin=; path=/; max-age=0'
    router.push('/login')
  }

  // Filter nav items based on admin status
  const filterItems = (items: NavItem[]) => 
    items.filter(item => !item.adminOnly || isAdmin)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-0)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-70 flex-col z-40" 
             style={{ 
               background: 'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-0) 100%)',
               borderRight: '1px solid var(--surface-3)',
               backdropFilter: 'blur(10px)'
             }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5" style={{ borderBottom: '1px solid var(--surface-3)' }}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 10l8 5 8-5"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Aurotek Portal</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>銷售管理系統</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-4">
          {NAV_GROUPS.map(group => {
            const items = filterItems(group.items)
            if (items.length === 0) return null
            return (
              <div key={group.label} className="mb-6">
                <div className="px-4 mb-3 text-xs uppercase tracking-wider font-semibold"
                     style={{ color: 'var(--text-tertiary)' }}>
                  {group.label}
                </div>
                {items.map(item => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
                      isActive(item.href)
                        ? 'active-nav-item shadow-lg'
                        : 'nav-item'
                    }`}
                    style={{
                      ...(isActive(item.href) 
                        ? {
                            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                          }
                        : {
                            color: 'var(--text-secondary)'
                          }
                      )
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.href)) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-hover)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.href)) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }
                    }}
                  >
                    <span className={isActive(item.href) ? 'text-white' : ''}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                ))}
              </div>
            )
          })}
        </nav>

        {/* User Info & Controls */}
        <div className="p-4" style={{ borderTop: '1px solid var(--surface-3)' }}>
          {userName && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" 
                 style={{ backgroundColor: 'var(--surface-2)' }}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {userName}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {isAdmin ? '管理員' : '使用者'}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            {icons.logout}
            <span>登出</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50"
              style={{ 
                backgroundColor: 'var(--surface-0)', 
                borderBottom: '1px solid var(--surface-3)',
                backdropFilter: 'blur(10px)'
              }}>
        {/* Left side - Hamburger Menu */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--surface-3)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-hover)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {icons.hamburger}
        </button>

        {/* Center - Logo & Title */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 10l8 5 8-5"/>
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Aurotek Portal
          </span>
        </Link>

        {/* Right side - Theme Toggle & User */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {userName && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-70 pt-14 md:pt-0 min-h-screen" style={{ backgroundColor: 'var(--surface-0)' }}>
        {children}
      </main>

      {/* Mobile Slide-in Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] flex flex-col transition-transform duration-300"
               style={{ 
                 backgroundColor: 'var(--surface-0)',
                 borderRight: '1px solid var(--surface-3)'
               }}>
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 h-14" 
                 style={{ borderBottom: '1px solid var(--surface-3)' }}>
              <Link href="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                  <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                    <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 10l8 5 8-5"/>
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Aurotek Portal
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    銷售管理系統
                  </div>
                </div>
              </Link>
              
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ 
                  backgroundColor: 'var(--surface-2)', 
                  color: 'var(--text-secondary)' 
                }}
              >
                {icons.close}
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4">
              {NAV_GROUPS.map(group => {
                const items = filterItems(group.items)
                if (items.length === 0) return null
                return (
                  <div key={group.label} className="mb-6">
                    <div className="px-3 mb-3 text-xs uppercase tracking-wider font-semibold"
                         style={{ color: 'var(--text-tertiary)' }}>
                      {group.label}
                    </div>
                    <div className="space-y-1">
                      {items.map(item => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                            isActive(item.href) ? 'mobile-nav-active' : 'mobile-nav-item'
                          }`}
                          style={{
                            ...(isActive(item.href) 
                              ? {
                                  backgroundColor: 'var(--primary-50)',
                                  color: 'var(--primary-600)',
                                  borderLeft: '3px solid var(--primary-500)',
                                  marginLeft: '0px',
                                  paddingLeft: '9px'
                                }
                              : {
                                  color: 'var(--text-secondary)'
                                }
                            )
                          }}
                        >
                          <span className={`${isActive(item.href) ? 'text-current' : ''}`}>
                            {item.icon}
                          </span>
                          <span className="text-sm font-medium">{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </nav>

            {/* User Info & Logout */}
            <div className="p-4" style={{ borderTop: '1px solid var(--surface-3)' }}>
              {userName && (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" 
                     style={{ backgroundColor: 'var(--surface-2)' }}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {userName}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {isAdmin ? '管理員' : '使用者'}
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium"
                style={{ 
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {icons.logout}
                <span>登出</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}