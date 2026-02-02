'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth')
    if (auth === 'true') setIsLoggedIn(true)
  }, [])

  const handleLogin = () => {
    // 簡單密碼驗證
    if (password === 'aurotek2026') {
      localStorage.setItem('admin_auth', 'true')
      setIsLoggedIn(true)
      setError('')
    } else {
      setError('密碼錯誤')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth')
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">🔐 後台管理系統</h1>
          <input
            type="password"
            placeholder="請輸入管理密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            登入
          </button>
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
