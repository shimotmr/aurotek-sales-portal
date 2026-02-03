'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Admin {
  email: string
  name: string
  role: 'admin' | 'super_admin'
  addedAt: string
  addedBy: string
}

export default function AdminsManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([
    { email: 'williamhsiao@aurotek.com', name: 'williamhsiao', role: 'super_admin', addedAt: '2026-02-03', addedBy: 'system' }
  ])
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState('')

  useEffect(() => {
    // 從 cookie 讀取當前用戶權限
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return ''
    }
    
    setIsSuperAdmin(getCookie('is_super_admin') === 'true')
    setCurrentUser(getCookie('user_email') || '')
  }, [])

  const handleAddAdmin = () => {
    if (!newEmail) return
    
    const email = newEmail.includes('@') ? newEmail : `${newEmail}@aurotek.com`
    
    // 檢查是否已存在
    if (admins.some(a => a.email === email)) {
      alert('此帳號已是管理員')
      return
    }
    
    const newAdmin: Admin = {
      email,
      name: email.split('@')[0],
      role: newRole,
      addedAt: new Date().toISOString().split('T')[0],
      addedBy: currentUser
    }
    
    setAdmins([...admins, newAdmin])
    setNewEmail('')
    
    // TODO: 儲存到 Google Sheets
  }

  const handleRemoveAdmin = (email: string) => {
    if (email === 'williamhsiao@aurotek.com') {
      alert('無法移除超級管理員')
      return
    }
    
    if (confirm(`確定要移除 ${email} 的管理員權限嗎？`)) {
      setAdmins(admins.filter(a => a.email !== email))
      // TODO: 從 Google Sheets 移除
    }
  }

  if (!isSuperAdmin) {
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">← 返回後台</Link>
            <h1 className="text-xl font-bold">👑 管理員管理</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 新增管理員 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">新增管理員</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">帳號</label>
              <input
                type="text"
                placeholder="例如: u1234 或 u1234@aurotek.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">角色</label>
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
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            >
              新增
            </button>
          </div>
        </div>

        {/* 管理員列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold">管理員列表</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">帳號</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">角色</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">新增日期</th>
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
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        👑 超級管理員
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        🔧 一般管理員
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{admin.addedAt}</td>
                  <td className="px-6 py-4 text-gray-600">{admin.addedBy}</td>
                  <td className="px-6 py-4">
                    {admin.email !== 'williamhsiao@aurotek.com' ? (
                      <button
                        onClick={() => handleRemoveAdmin(admin.email)}
                        className="text-red-600 hover:text-red-800"
                      >
                        移除
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 說明 */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ 權限說明</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>一般管理員</strong>：可存取後台管理系統的所有功能</li>
            <li>• <strong>超級管理員</strong>：可管理其他管理員帳號</li>
            <li>• 所有員工都可以用公司郵箱登入系統查看資料</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
