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

// 操作類型中文對照和顏色
const actionConfig: Record<string, { label: string; color: string }> = {
  login: { label: '登入', color: 'bg-green-100 text-green-700' },
  login_failed: { label: '登入失敗', color: 'bg-red-100 text-red-700' },
  logout: { label: '登出', color: 'bg-gray-100 text-gray-700' },
  page_view: { label: '瀏覽頁面', color: 'bg-blue-100 text-blue-700' },
  click: { label: '點擊', color: 'bg-indigo-100 text-indigo-700' },
  team_create: { label: '新增業務員', color: 'bg-emerald-100 text-emerald-700' },
  team_update: { label: '編輯業務員', color: 'bg-yellow-100 text-yellow-700' },
  team_delete: { label: '刪除業務員', color: 'bg-red-100 text-red-700' },
  dealer_create: { label: '新增經銷商', color: 'bg-emerald-100 text-emerald-700' },
  dealer_update: { label: '編輯經銷商', color: 'bg-yellow-100 text-yellow-700' },
  dealer_delete: { label: '刪除經銷商', color: 'bg-red-100 text-red-700' },
  target_create: { label: '新增目標', color: 'bg-emerald-100 text-emerald-700' },
  target_update: { label: '編輯目標', color: 'bg-yellow-100 text-yellow-700' },
  video_create: { label: '新增影片', color: 'bg-emerald-100 text-emerald-700' },
  video_update: { label: '編輯影片', color: 'bg-yellow-100 text-yellow-700' },
  video_delete: { label: '刪除影片', color: 'bg-red-100 text-red-700' },
  video_play: { label: '播放影片', color: 'bg-purple-100 text-purple-700' },
  slide_create: { label: '新增簡報', color: 'bg-emerald-100 text-emerald-700' },
  slide_update: { label: '編輯簡報', color: 'bg-yellow-100 text-yellow-700' },
  slide_delete: { label: '刪除簡報', color: 'bg-red-100 text-red-700' },
  slide_open: { label: '開啟簡報', color: 'bg-purple-100 text-purple-700' },
  admin_add: { label: '新增管理員', color: 'bg-orange-100 text-orange-700' },
  admin_remove: { label: '移除管理員', color: 'bg-orange-100 text-orange-700' },
  sync_upload: { label: '上傳同步', color: 'bg-cyan-100 text-cyan-700' },
  sync_complete: { label: '同步完成', color: 'bg-cyan-100 text-cyan-700' },
  system: { label: '系統', color: 'bg-purple-100 text-purple-700' },
  error: { label: '錯誤', color: 'bg-red-100 text-red-700' },
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
      params.set('limit', '500')
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

  const getActionBadge = (action: string) => {
    const config = actionConfig[action] || { label: action, color: 'bg-gray-100 text-gray-700' }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
  }

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('zh-TW', {
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

  const parseDetails = (details: string) => {
    try {
      const obj = JSON.parse(details)
      if (obj.pageName) return obj.pageName
      if (obj.page) return obj.page
      if (obj.name) return obj.name
      if (obj.title) return obj.title
      if (obj.id) return `ID: ${obj.id}`
      return details
    } catch {
      return details
    }
  }

  const exportCSV = () => {
    const headers = ['時間', '操作', '用戶', 'IP', '詳情']
    const rows = logs.map(log => [
      formatTime(log.timestamp),
      actionConfig[log.action]?.label || log.action,
      log.user,
      log.ip,
      parseDetails(log.details)
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `系統日誌_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 統計
  const stats = {
    total: logs.length,
    logins: logs.filter(l => l.action === 'login').length,
    pageViews: logs.filter(l => l.action === 'page_view').length,
    edits: logs.filter(l => l.action.includes('update') || l.action.includes('create') || l.action.includes('delete')).length,
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>
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
            <span className="text-lg bg-gradient-to-br from-gray-600 to-gray-800 bg-clip-text text-transparent">📋</span>
            <h1 className="text-lg font-bold text-slate-800">系統日誌</h1>
          </div>
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
          >
            📥 匯出 CSV
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 統計卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-500">總記錄數</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.logins}</div>
            <div className="text-sm text-gray-500">登入次數</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.pageViews}</div>
            <div className="text-sm text-gray-500">頁面瀏覽</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{stats.edits}</div>
            <div className="text-sm text-gray-500">編輯操作</div>
          </div>
        </div>

        {/* 篩選 */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="搜尋用戶..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded-lg w-48"
            />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="p-2 border rounded-lg"
            >
              <option value="all">所有操作</option>
              <optgroup label="認證">
                <option value="login">登入</option>
                <option value="login_failed">登入失敗</option>
                <option value="logout">登出</option>
              </optgroup>
              <optgroup label="瀏覽">
                <option value="page_view">頁面瀏覽</option>
              </optgroup>
              <optgroup label="業務團隊">
                <option value="team_create">新增業務員</option>
                <option value="team_update">編輯業務員</option>
                <option value="team_delete">刪除業務員</option>
              </optgroup>
              <optgroup label="經銷商">
                <option value="dealer_create">新增經銷商</option>
                <option value="dealer_update">編輯經銷商</option>
                <option value="dealer_delete">刪除經銷商</option>
              </optgroup>
              <optgroup label="影片">
                <option value="video_create">新增影片</option>
                <option value="video_update">編輯影片</option>
                <option value="video_delete">刪除影片</option>
              </optgroup>
              <optgroup label="簡報">
                <option value="slide_create">新增簡報</option>
                <option value="slide_update">編輯簡報</option>
                <option value="slide_delete">刪除簡報</option>
              </optgroup>
            </select>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 重新整理
            </button>
          </div>
        </div>

        {/* 日誌列表 */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 w-36">時間</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 w-32">操作</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">用戶</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">詳情</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 w-28">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log, i) => (
                <tr key={log.id || i} className="hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm text-gray-500 font-mono">
                    {formatTime(log.timestamp)}
                  </td>
                  <td className="py-2 px-4">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="py-2 px-4 text-sm">
                    {log.user?.replace('@aurotek.com', '') || '-'}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-600 truncate max-w-xs" title={log.details}>
                    {parseDetails(log.details)}
                  </td>
                  <td className="py-2 px-4 text-xs text-gray-400 font-mono">
                    {log.ip?.substring(0, 15) || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              暫無日誌記錄
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
