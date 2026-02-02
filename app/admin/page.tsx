'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null)

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth')
    const user = localStorage.getItem('admin_user')
    const savedUsername = localStorage.getItem('admin_saved_username')
    
    if (auth === 'true' && user) {
      setIsLoggedIn(true)
      setCurrentUser(JSON.parse(user))
    }
    if (savedUsername) {
      setUsername(savedUsername)
    }
  }, [])

  const handleLogin = async () => {
    if (!username || !password) {
      setError('請輸入帳號和密碼')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/zimbra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('admin_auth', 'true')
        localStorage.setItem('admin_user', JSON.stringify(data.user))
        if (rememberMe) {
          localStorage.setItem('admin_saved_username', username)
        } else {
          localStorage.removeItem('admin_saved_username')
        }
        setIsLoggedIn(true)
        setCurrentUser(data.user)
        setError('')
      } else {
        setError(data.message || '登入失敗')
      }
    } catch (err) {
      setError('連線錯誤，請稍後再試')
    }

    setIsLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth')
    localStorage.removeItem('admin_user')
    setIsLoggedIn(false)
    setCurrentUser(null)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-xl font-bold text-center text-gray-700 mb-8">
            請輸入 AD 帳號/密碼登入系統
          </h1>
          
          <div className="space-y-4">
            {/* 帳號欄位 */}
            <div className="relative">
              <input
                type="text"
                placeholder="u1612"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 pr-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            {/* 密碼欄位 */}
            <div className="relative">
              <input
                type="password"
                placeholder="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full p-4 pr-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* 記住帳號 */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div 
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-6 h-6 rounded flex items-center justify-center border-2 transition ${
                  rememberMe ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}
              >
                {rememberMe && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-gray-700 font-medium">記住我的帳號</span>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition mt-6 disabled:opacity-50"
          >
            {isLoading ? '驗證中...' : '登 入'}
          </button>
          
          <Link href="/" className="block text-center mt-6 text-gray-400 hover:text-gray-600 text-sm">
            ← 返回首頁
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">⚙️ 後台管理系統</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">👤 {currentUser?.name || currentUser?.email}</span>
            <Link href="/" className="text-gray-600 hover:text-gray-900">首頁</Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 銷售漏斗 */}
          <Link href="/admin/funnel" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-l-4 border-indigo-500">
            <div className="text-3xl mb-3">📊</div>
            <h2 className="text-lg font-bold mb-2">銷售漏斗</h2>
            <p className="text-gray-600 text-sm">成交率分層分析、營業員/經銷商篩選</p>
          </Link>

          {/* 目標管理 */}
          <Link href="/admin/targets" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-l-4 border-blue-500">
            <div className="text-3xl mb-3">🎯</div>
            <h2 className="text-lg font-bold mb-2">目標管理</h2>
            <p className="text-gray-600 text-sm">設定年度目標、月度目標、個人目標</p>
          </Link>

          {/* 業務團隊 */}
          <Link href="/admin/team" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-l-4 border-green-500">
            <div className="text-3xl mb-3">👥</div>
            <h2 className="text-lg font-bold mb-2">業務團隊</h2>
            <p className="text-gray-600 text-sm">管理業務員資料與績效</p>
          </Link>

          {/* 經銷商管理 */}
          <Link href="/admin/dealers" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-l-4 border-purple-500">
            <div className="text-3xl mb-3">🏢</div>
            <h2 className="text-lg font-bold mb-2">經銷商管理</h2>
            <p className="text-gray-600 text-sm">維護經銷商資料與聯絡人</p>
          </Link>

          {/* 影片管理 */}
          <Link href="/admin/videos" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-l-4 border-red-500">
            <div className="text-3xl mb-3">🎬</div>
            <h2 className="text-lg font-bold mb-2">影片管理</h2>
            <p className="text-gray-600 text-sm">管理影片案例、分類、連結</p>
          </Link>

          {/* 簡報管理 */}
          <Link href="/admin/slides" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-l-4 border-yellow-500">
            <div className="text-3xl mb-3">📑</div>
            <h2 className="text-lg font-bold mb-2">簡報管理</h2>
            <p className="text-gray-600 text-sm">管理簡報案例、分類、權限</p>
          </Link>

          {/* 資料同步 */}
          <Link href="/admin/sync" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-l-4 border-orange-500">
            <div className="text-3xl mb-3">🔄</div>
            <h2 className="text-lg font-bold mb-2">資料同步</h2>
            <p className="text-gray-600 text-sm">同步 Google Sheets 資料</p>
          </Link>

          {/* 系統設定 */}
          <Link href="/admin/settings" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-l-4 border-gray-500">
            <div className="text-3xl mb-3">⚙️</div>
            <h2 className="text-lg font-bold mb-2">系統設定</h2>
            <p className="text-gray-600 text-sm">API 設定、通知設定</p>
          </Link>
        </div>

        {/* 快速統計 */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4">📊 系統概覽</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-600">業務人員</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">149,650K</div>
              <div className="text-sm text-gray-600">年度目標</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">10+</div>
              <div className="text-sm text-gray-600">經銷商</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">853</div>
              <div className="text-sm text-gray-600">案件數</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
