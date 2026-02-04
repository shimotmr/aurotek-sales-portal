'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [error, setError] = useState('')

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('limit', '200')
      if (actionFilter !== 'all') params.set('action', actionFilter)
      if (filter) params.set('user', filter)
      
      const res = await fetch(`/api/logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch logs')
      
      const data = await res.json()
      setLogs(data.logs || [])
      setError('')
    } catch (err) {
      console.error('Failed to fetch logs:', err)
      setError('讀取日誌失敗')
    }
    setIsLoading(false)
  }, [actionFilter, filter])

  useEffect(() => {
    fetchLogs()
    // 每 30 秒自動更新
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  const filteredLogs = logs.filter(log => {
    if (filter && !log.user.toLowerCase().includes(filter.toLowerCase())) return false
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
      system: { color: 'bg-purple-100 text-purple-700', label: '系統' },
    }
    const badge = badges[action] || { color: 'bg-gray-100 text-gray-700', label: action }
    return <span className={`px-2 py-1 rounded-full text-xs ${badge.color}`}>{badge.label}</span>
  }

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return timestamp
    }
  }

  const exportCSV = () => {
    const headers = ['時間', '操作', '用戶', 'IP', '詳情']
    const rows = filteredLogs.map(log => [
      formatTime(log.timestamp),
      log.action,
      log.user,
      log.ip,
      log.details
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
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
          <button
            onClick={fetchLogs}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            🔄 重新整理
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 篩選器 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
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
          <button 
            onClick={exportCSV}
            className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            📥 匯出 CSV
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 日誌列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">載入中...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              沒有找到符合條件的日誌
              <p className="text-sm mt-2">日誌會在用戶登入/登出時自動記錄</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                      <td className="px-6 py-4 text-sm font-medium">{log.user}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{log.ip}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 統計 */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(l => l.action === 'login').length}
            </div>
            <div className="text-sm text-gray-500">登入成功</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.action === 'login_failed').length}
            </div>
            <div className="text-sm text-gray-500">登入失敗</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {logs.filter(l => l.action === 'logout').length}
            </div>
            <div className="text-sm text-gray-500">登出</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-600">{logs.length}</div>
            <div className="text-sm text-gray-500">總記錄數</div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          💡 日誌每 30 秒自動更新 · 目前使用內存存儲，部署後會重置
        </p>
      </main>
    </div>
  )
}
