'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null)

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth')
    const user = localStorage.getItem('admin_user')
    if (auth === 'true' && user) {
      setIsLoggedIn(true)
      setCurrentUser(JSON.parse(user))
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-2">🔐 後台管理系統</h1>
          <p className="text-center text-gray-500 text-sm mb-6">使用公司郵箱帳號登入</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">帳號</label>
              <input
                type="text"
                placeholder="例：williamhsiao 或 williamhsiao@aurotek.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <input
                type="password"
                placeholder="郵箱密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mt-6 disabled:opacity-50"
          >
            {isLoading ? '驗證中...' : '登入'}
          </button>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            使用和椿 Zimbra 郵箱帳號密碼驗證
          </p>
          
          <Link href="/" className="block text-center mt-4 text-gray-500 hover:text-gray-700">
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
