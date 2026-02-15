'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// 頁面名稱對照
const pageNames: Record<string, string> = {
  '/': '首頁',
  '/performance': '業績管理',
  '/cases': '案件管理',
  '/marketing': '數位資源庫',
  '/marketing/videos': '影片瀏覽',
  '/marketing/slides': '簡報瀏覽',
  '/marketing/walker-docs': 'Walker 文檔',
  '/admin': '後台管理',
  '/admin/team': '業務團隊管理',
  '/admin/dealers': '經銷商管理',
  '/admin/targets': '目標設定',
  '/admin/videos': '影片管理',
  '/admin/slides': '簡報管理',
  '/admin/admins': '管理員設定',
  '/admin/logs': '系統日誌',
  '/admin/funnel': 'Funnel 管理',
  '/admin/sync': '同步工具',
}

export function usePageTracking() {
  const pathname = usePathname()
  
  useEffect(() => {
    // 不追蹤 login 頁面和 API 路由
    if (pathname === '/login' || pathname.startsWith('/api')) {
      return
    }
    
    const pageName = pageNames[pathname] || pathname
    
    // 發送頁面瀏覽記錄
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'page_view',
        details: { page: pathname, pageName }
      })
    }).catch(err => console.error('Failed to log page view:', err))
    
  }, [pathname])
}

// 追蹤按鈕點擊
export function trackClick(element: string, details?: Record<string, unknown>) {
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'click',
      details: { element, ...details }
    })
  }).catch(err => console.error('Failed to log click:', err))
}
