'use client'

import { LogIn, Eye, Pencil, Settings, LogOut, Download, RefreshCw, Trash2, Plus, Play, FileText, Upload, AlertCircle, MousePointer, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

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

const pageNames: Record<string, string> = {
  '/': '首頁',
  '/admin': '後台管理',
  '/admin/logs': '後台管理 / 系統日誌',
  '/admin/admins': '後台管理 / 管理員',
  '/performance': '業績總覽',
  '/products': '產品管理',
  '/quotations': '報價單',
  '/cases': '案件管理',
  '/transcripts': '逐字稿',
}

type IconCategory = 'login' | 'login_failed' | 'logout' | 'page_view' | 'crud' | 'other'

const actionLabels: Record<string, string> = {
  login: '登入',
  login_failed: '登入失敗',
  logout: '登出',
  page_view: '瀏覽頁面',
  click: '點擊',
  team_create: '新增業務員',
  team_update: '編輯業務員',
  team_delete: '刪除業務員',
  dealer_create: '新增經銷商',
  dealer_update: '編輯經銷商',
  dealer_delete: '刪除經銷商',
  target_create: '新增目標',
  target_update: '編輯目標',
  video_create: '新增影片',
  video_update: '編輯影片',
  video_delete: '刪除影片',
  video_play: '播放影片',
  slide_create: '新增簡報',
  slide_update: '編輯簡報',
  slide_delete: '刪除簡報',
  slide_open: '開啟簡報',
  admin_add: '新增管理員',
  admin_remove: '移除管理員',
  sync_upload: '上傳同步',
  sync_complete: '同步完成',
  system: '系統',
  error: '錯誤',
}

function getIconCategory(action: string): IconCategory {
  if (action === 'login') return 'login'
  if (action === 'login_failed') return 'login_failed'
  if (action === 'logout') return 'logout'
  if (action === 'page_view' || action === 'click' || action === 'video_play' || action === 'slide_open') return 'page_view'
  if (action.includes('create') || action.includes('update') || action.includes('delete') || action === 'sync_upload' || action === 'sync_complete' || action === 'admin_add' || action === 'admin_remove') return 'crud'
  return 'other'
}

function ActionIcon({ action }: { action: string }) {
  const cat = getIconCategory(action)
  const label = actionLabels[action] || action
  const base = 'w-4 h-4'
  let icon
  switch (cat) {
    case 'login': icon = <LogIn className={`${base} text-green-600`} />; break
    case 'login_failed': icon = <LogIn className={`${base} text-red-500`} />; break
    case 'logout': icon = <LogOut className={`${base} text-slate-500`} />; break
    case 'page_view': icon = <Eye className={`${base} text-blue-500`} />; break
    case 'crud': icon = <Pencil className={`${base} text-orange-500`} />; break
    default: icon = <Settings className={`${base} text-slate-400`} />; break
  }
  return <span title={label} className="cursor-help">{icon}</span>
}

const legendItems = [
  { icon: <LogIn className="w-3.5 h-3.5 text-green-600" />, label: '登入' },
  { icon: <LogIn className="w-3.5 h-3.5 text-red-500" />, label: '登入失敗' },
  { icon: <LogOut className="w-3.5 h-3.5 text-slate-500" />, label: '登出' },
  { icon: <Eye className="w-3.5 h-3.5 text-blue-500" />, label: '瀏覽' },
  { icon: <Pencil className="w-3.5 h-3.5 text-orange-500" />, label: '資料操作' },
  { icon: <Settings className="w-3.5 h-3.5 text-slate-400" />, label: '其他' },
]

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

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      return `${mm}/${dd} ${hh}:${min}`
    } catch { return ts }
  }

  const formatTimeFull = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
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
      actionLabels[log.action] || log.action,
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
            <p className="text-xs text-slate-400">audit_logs</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          匯出 CSV
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-2">
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
            className="text-sm px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            重新整理
          </button>
          {isLoading && <span className="text-xs text-slate-400">載入中...</span>}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 mb-2 text-xs text-slate-500">
        {legendItems.map(item => (
          <span key={item.label} className="inline-flex items-center gap-1">
            {item.icon}
            {item.label}
          </span>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-36">時間</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-12">操作</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-28">用戶</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">詳情</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-24">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-2 px-4 text-xs text-slate-500 font-mono whitespace-nowrap" title={formatTimeFull(log.created_at)}>
                    {formatTime(log.created_at)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <ActionIcon action={log.action} />
                  </td>
                  <td className="py-2 px-4 text-sm text-slate-700 whitespace-nowrap">
                    {(log.user_name || '-').replace('@aurotek.com', '')}
                  </td>
                  <td className="py-2 px-4 text-xs text-slate-500 truncate max-w-xs" title={log.page || log.details || ''}>
                    {log.action === 'page_view' && log.page
                      ? (pageNames[log.page] || log.page)
                      : log.page
                        ? (pageNames[log.page] || log.page)
                        : parseDetails(log.details)
                    }
                  </td>
                  <td className="py-2 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                    {log.ip?.substring(0, 15) || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && !isLoading && (
          <div className="text-center py-16 text-slate-400 text-sm">
            暫無日誌記錄
          </div>
        )}
      </div>
    </div>
  )
}
