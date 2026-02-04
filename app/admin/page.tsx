'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    // 從 cookie 讀取用戶資訊
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return ''
    }
    
    const userName = getCookie('user_name')
    const userEmail = getCookie('user_email')
    const superAdmin = getCookie('is_super_admin') === 'true'
    
    if (userName && userEmail) {
      setCurrentUser({ name: userName, email: userEmail })
      setIsSuperAdmin(superAdmin)
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
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
            <p className="text-gray-600 text-sm">上傳 Funnel 報表、同步資料</p>
          </Link>

          {/* 系統日誌 */}
          <Link href="/admin/logs" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-l-4 border-cyan-500">
            <div className="text-3xl mb-3">📋</div>
            <h2 className="text-lg font-bold mb-2">系統日誌</h2>
            <p className="text-gray-600 text-sm">查看登入記錄、操作記錄</p>
          </Link>

          {/* 管理員管理 - 只有超級管理員可見 */}
          {isSuperAdmin && (
            <Link href="/admin/admins" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border-l-4 border-pink-500">
              <div className="text-3xl mb-3">👑</div>
              <h2 className="text-lg font-bold mb-2">管理員管理</h2>
              <p className="text-gray-600 text-sm">新增、移除管理員帳號</p>
            </Link>
          )}
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
