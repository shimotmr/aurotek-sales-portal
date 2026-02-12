'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface AuditLog {
  id: string
  timestamp: string
  action: string
  user_id: string | null
  user_name: string
  ip: string | null
  details: string | null
  page: string | null
  created_at: string
}

const actionConfig: Record<string, { label: string; color: string }> = {
  login: { label: '登入', color: 'bg-green-50 text-green-700 border-green-200' },
  login_failed: { label: '登入失敗', color: 'bg-red-50 text-red-700 border-red-200' },
  logout: { label: '登出', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  page_view: { label: '瀏覽頁面', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  click: { label: '點擊', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  team_create: { label: '新增業務員', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  team_update: { label: '編輯業務員', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  team_delete: { label: '刪除業務員', color: 'bg-red-50 text-red-700 border-red-200' },
  dealer_create: { label: '新增經銷商', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  dealer_update: { label: '編輯經銷商', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  dealer_delete: { label: '刪除經銷商', color: 'bg-red-50 text-red-700 border-red-200' },
  target_create: { label: '新增目標', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  target_update: { label: '編輯目標', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  video_create: { label: '新增影片', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  video_update: { label: '編輯影片', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  video_delete: { label: '刪除影片', color: 'bg-red-50 text-red-700 border-red-200' },
  video_play: { label: '播放影片', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  slide_create: { label: '新增簡報', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  slide_update: { label: '編輯簡報', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  slide_delete: { label: '刪除簡報', color: 'bg-red-50 text-red-700 border-red-200' },
  slide_open: { label: '開啟簡報', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  admin_add: { label: '新增管理員', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  admin_remove: { label: '移除管理員', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  sync_upload: { label: '上傳同步', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  sync_complete: { label: '同步完成', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  system: { label: '系統', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  error: { label: '錯誤', color: 'bg-red-50 text-red-700 border-red-200' },
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [searchText, setSearchText] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(500)

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter)
      }
      if (searchText) {
        query = query.ilike('user_name', `%${searchText}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      setLogs(data || [])
      setTotalCount(count || 0)
    } catch (e) {
      console.error('Failed to fetch audit logs:', e)
    }
    setIsLoading(false)
  }, [actionFilter, searchText])

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  const getActionBadge = (action: string) => {
    const config = actionConfig[action] || { label: action, color: 'bg-slate-50 text-slate-600 border-slate-200' }
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>{config.label}</span>
  }

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('zh-TW', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    } catch { return ts }
  }

  const parseDetails = (details: string | null) => {
    if (!details) return '-'
    try {
      const obj = JSON.parse(details)
      if (obj.pageName) return obj.pageName
      if (obj.page) return obj.page
      if (obj.name) return obj.name
      if (obj.title) return obj.title
      if (obj.reason) return obj.reason
      if (obj.redirect) return `→ ${obj.redirect}`
      return details
    } catch { return details }
  }

  const exportCSV = () => {
    const headers = ['時間', '操作', '用戶', 'IP', '詳情', '頁面']
    const rows = logs.map(log => [
      formatTime(log.created_at),
      actionConfig[log.action]?.label || log.action,
      log.user_name,
      log.ip || '',
      parseDetails(log.details),
      log.page || ''
    ])
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `系統日誌_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Stats
  const stats = {
    total: totalCount,
    logins: logs.filter(l => l.action === 'login').length,
    pageViews: logs.filter(l => l.action === 'page_view').length,
    edits: logs.filter(l => l.action.includes('update') || l.action.includes('create') || l.action.includes('delete')).length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-slate-400 hover:text-slate-600 transition">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800">系統日誌</h1>
            <p className="text-xs text-slate-400">audit_logs · 即時監控</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline-block mr-1 -mt-0.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>匯出 CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: '總記錄數', value: stats.total, color: 'text-slate-800' },
          { label: '登入次數', value: stats.logins, color: 'text-green-600' },
          { label: '頁面瀏覽', value: stats.pageViews, color: 'text-blue-600' },
          { label: '資料操作', value: stats.edits, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="搜尋用戶..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg w-44 focus:outline-none focus:border-slate-400"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
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
            <optgroup label="影片 / 簡報">
              <option value="video_create">新增影片</option>
              <option value="video_delete">刪除影片</option>
              <option value="slide_create">新增簡報</option>
              <option value="slide_delete">刪除簡報</option>
            </optgroup>
          </select>
          <button
            onClick={fetchLogs}
            className="text-sm px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline-block mr-1 -mt-0.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>重新整理
          </button>
          {isLoading && <span className="text-xs text-slate-400">載入中...</span>}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-36">時間</th>
              <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-28">操作</th>
              <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-28">用戶</th>
              <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">詳情</th>
              <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-24">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition">
                <td className="py-2 px-4 text-xs text-slate-500 font-mono">
                  {formatTime(log.created_at)}
                </td>
                <td className="py-2 px-4">
                  {getActionBadge(log.action)}
                </td>
                <td className="py-2 px-4 text-sm text-slate-700">
                  {(log.user_name || '-').replace('@aurotek.com', '')}
                </td>
                <td className="py-2 px-4 text-xs text-slate-500 truncate max-w-xs" title={log.details || ''}>
                  {log.page && <span className="text-slate-400 mr-1">{log.page}</span>}
                  {parseDetails(log.details)}
                </td>
                <td className="py-2 px-4 text-xs text-slate-400 font-mono">
                  {log.ip?.substring(0, 15) || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && !isLoading && (
          <div className="text-center py-16 text-slate-400 text-sm">
            暫無日誌記錄
          </div>
        )}
      </div>
    </div>
  )
}
