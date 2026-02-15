'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function UserMenu() {
  const router = useRouter()
  const [userName, setUserName] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    // 從 cookie 讀取用戶名稱
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '')
      return null
    }
    
    const name = getCookie('user_name') || getCookie('user_email')
    if (name) {
      // 只顯示 @ 前面的部分
      setUserName(name.split('@')[0])
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
    }
  }

  if (!userName) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-gray-700"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline">{userName}</span>
        <svg className={`w-4 h-4 transition ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20 py-1">
            <div className="px-4 py-2 border-b">
              <p className="text-sm text-gray-500">登入帳號</p>
              <p className="font-medium text-gray-900 truncate">{userName}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  登出中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  登出
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
