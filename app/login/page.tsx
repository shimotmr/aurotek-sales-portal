'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

import { logActionWithIP } from '@/lib/audit'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 從 localStorage 讀取保存的帳號
    const savedUsername = localStorage.getItem('saved_username')
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success) {
        if (rememberMe) {
          localStorage.setItem('saved_username', username)
        } else {
          localStorage.removeItem('saved_username')
        }
        
        // 記錄登入成功
        logActionWithIP('login', JSON.stringify({ redirect }), '/login', username)
        
        // 登入成功，跳轉到原始頁面
        router.push(redirect)
        router.refresh()
      } else {
        // 記錄登入失敗
        logActionWithIP('login_failed', JSON.stringify({ reason: data.message }), '/login', username)
        setError(data.message || '登入失敗')
      }
    } catch (err) {
      setError('連線錯誤，請稍後再試')
    }

    setIsLoading(false)
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🤖</div>
        <h1 className="text-2xl font-bold text-gray-800">通路營業管理系統</h1>
        <p className="text-gray-500 text-sm mt-2">請使用公司郵箱帳號登入</p>
      </div>
      
      <div className="space-y-4">
        {/* 帳號欄位 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">帳號</label>
          <div className="relative">
            <input
              type="text"
              placeholder="例如: u1612 或 u1612@aurotek.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 pr-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 密碼欄位 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
          <div className="relative">
            <input
              type="password"
              placeholder="公司郵箱密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full p-4 pr-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 記住帳號 */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div 
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-5 h-5 rounded flex items-center justify-center border-2 transition ${
              rememberMe ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
            }`}
          >
            {rememberMe && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-gray-600 text-sm">記住我的帳號</span>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}
      
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition mt-6 disabled:opacity-50 shadow-lg"
      >
        {isLoading ? '驗證中...' : '登 入'}
      </button>
      
      <p className="text-center mt-6 text-gray-400 text-xs">
        和椿科技 · 機器人事業處 · 通路營業部
      </p>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🤖</div>
        <h1 className="text-2xl font-bold text-gray-800">通路營業管理系統</h1>
        <p className="text-gray-500 text-sm mt-2">載入中...</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
