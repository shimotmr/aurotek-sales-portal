'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Admin {
  email: string
  name: string
  role: 'admin' | 'super_admin'
  addedAt: string
  addedBy: string
}

export default function AdminsManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admins')
      if (res.ok) {
        const data = await res.json()
        setAdmins(data.admins || [])
      } else if (res.status === 403) {
        setError('權限不足')
      }
    } catch (err) {
      console.error('Failed to fetch admins:', err)
      setError('讀取管理員名單失敗')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // 從 cookie 讀取當前用戶權限
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return ''
    }
    
    const superAdmin = getCookie('is_super_admin') === 'true'
    setIsSuperAdmin(superAdmin)
    setCurrentUser(getCookie('user_email') || '')
    
    if (superAdmin) {
      fetchAdmins()
    } else {
      setIsLoading(false)
    }
  }, [fetchAdmins])

  const handleAddAdmin = async () => {
    if (!newEmail) return
    
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, role: newRole })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(`已新增管理員：${data.admin.email}`)
        setNewEmail('')
        fetchAdmins()
      } else {
        setError(data.error || '新增失敗')
      }
    } catch (err) {
      setError('新增管理員失敗')
    }
  }

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`確定要移除 ${email} 的管理員權限嗎？`)) return
    
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch('/api/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(`已移除管理員：${email}`)
        fetchAdmins()
      } else {
        setError(data.error || '移除失敗')
      }
    } catch (err) {
      setError('移除管理員失敗')
    }
  }

  if (!isSuperAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">權限不足</h1>
          <p className="text-gray-600 mb-4">只有超級管理員可以存取此頁面</p>
          <Link href="/admin" className="text-blue-600 hover:underline">返回後台</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-slate-700 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </Link>
            <span className="text-lg bg-gradient-to-br from-gray-600 to-gray-800 bg-clip-text text-transparent">👑</span>
            <h1 className="text-lg font-bold text-slate-800">管理員管理</h1>
          </div>
          <button
            onClick={fetchAdmins}
            className="text-blue-600 hover:text-blue-800"
          >
            🔄 重新整理
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 提示訊息 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* 新增管理員 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">➕ 新增管理員</h2>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-gray-600 mb-1">帳號</label>
              <input
                type="text"
                placeholder="輸入帳號（如 u1234 或 email）"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">權限</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'super_admin')}
                className="p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="admin">一般管理員</option>
                <option value="super_admin">超級管理員</option>
              </select>
            </div>
            <button
              onClick={handleAddAdmin}
              disabled={!newEmail}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              新增
            </button>
          </div>
        </div>

        {/* 管理員列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold">📋 管理員名單</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">載入中...</div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-gray-500">沒有管理員</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">帳號</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">權限</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">新增時間</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">新增者</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {admins.map(admin => (
                  <tr key={admin.email} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{admin.name}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {admin.role === 'super_admin' ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          👑 超級管理員
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          🔧 一般管理員
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{admin.addedAt}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{admin.addedBy}</td>
                    <td className="px-6 py-4">
                      {admin.email === 'williamhsiao@aurotek.com' ? (
                        <span className="text-gray-400 text-sm">系統管理員</span>
                      ) : admin.email === currentUser ? (
                        <span className="text-gray-400 text-sm">目前登入</span>
                      ) : (
                        <button
                          onClick={() => handleRemoveAdmin(admin.email)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          移除
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ 注意事項</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 管理員可存取後台管理功能</li>
            <li>• 超級管理員可管理其他管理員帳號</li>
            <li>• 新增的管理員需要重新登入才會生效</li>
            <li>• 目前管理員名單存於伺服器記憶體，部署後會重置為預設值</li>
            <li>• 如需永久新增管理員，請聯繫系統管理員更新環境變數</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
