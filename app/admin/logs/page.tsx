'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LogEntry {
  id: string
  timestamp: string
  action: string
  user: string
  ip: string
  details: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: 從 API 讀取 logs
    // 暫時用模擬資料
    const mockLogs: LogEntry[] = [
      { id: '1', timestamp: '2026-02-03 17:55:00', action: 'login', user: 'williamhsiao@aurotek.com', ip: '220.xxx.xxx.xxx', details: '登入成功' },
      { id: '2', timestamp: '2026-02-03 14:30:00', action: 'view', user: 'williamhsiao@aurotek.com', ip: '220.xxx.xxx.xxx', details: '查看影片案例' },
      { id: '3', timestamp: '2026-02-03 14:10:00', action: 'view', user: 'williamhsiao@aurotek.com', ip: '220.xxx.xxx.xxx', details: '查看數位資源庫' },
    ]
    setLogs(mockLogs)
    setIsLoading(false)
  }, [])

  const filteredLogs = logs.filter(log => {
    if (filter && !log.user.toLowerCase().includes(filter.toLowerCase())) return false
    if (actionFilter !== 'all' && log.action !== actionFilter) return false
    return true
  })

  const getActionBadge = (action: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      login: { color: 'bg-green-100 text-green-700', label: '登入' },
      logout: { color: 'bg-gray-100 text-gray-700', label: '登出' },
      login_failed: { color: 'bg-red-100 text-red-700', label: '登入失敗' },
      view: { color: 'bg-blue-100 text-blue-700', label: '查看' },
      edit: { color: 'bg-yellow-100 text-yellow-700', label: '編輯' },
      delete: { color: 'bg-red-100 text-red-700', label: '刪除' },
    }
    const badge = badges[action] || { color: 'bg-gray-100 text-gray-700', label: action }
    return <span className={`px-2 py-1 rounded-full text-xs ${badge.color}`}>{badge.label}</span>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">← 返回後台</Link>
            <h1 className="text-xl font-bold">📋 系統日誌</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 篩選器 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜尋用戶..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="all">所有操作</option>
            <option value="login">登入</option>
            <option value="logout">登出</option>
            <option value="login_failed">登入失敗</option>
            <option value="view">查看</option>
            <option value="edit">編輯</option>
          </select>
          <button className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">
            匯出 CSV
          </button>
        </div>

        {/* 日誌列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">載入中...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">沒有找到符合條件的日誌</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">時間</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">用戶</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">IP</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">詳情</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{log.timestamp}</td>
                    <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4 text-sm">{log.user}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.ip}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 統計 */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">{logs.filter(l => l.action === 'login').length}</div>
            <div className="text-sm text-gray-500">今日登入</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600">{logs.filter(l => l.action === 'login_failed').length}</div>
            <div className="text-sm text-gray-500">登入失敗</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">{logs.filter(l => l.action === 'view').length}</div>
            <div className="text-sm text-gray-500">頁面瀏覽</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-600">{logs.length}</div>
            <div className="text-sm text-gray-500">總記錄數</div>
          </div>
        </div>
      </main>
    </div>
  )
}
