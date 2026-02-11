'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from "@/lib/supabase"

interface AgentTask {
  id: number
  task_type: string
  status: string
  priority: number
  assigned_to: string
  created_by: string
  payload: any
  result: any
  error: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

const AGENTS = [
  { id: 'main', name: 'Jarvis', emoji: '🤖', role: '主協調員・對話・調度・決策', status: 'active', model: 'Opus 4.6', color: '#4F46E5' },
  { id: 'secretary', name: 'Secretary', emoji: '📋', role: '簽核・郵件・行事曆', status: 'active', model: 'Opus 4.6', color: '#059669' },
  { id: 'analyst', name: 'Analyst', emoji: '📊', role: 'Pipeline・業績・報表', status: 'planned', model: 'Opus 4.6', color: '#9CA3AF' },
  { id: 'researcher', name: 'Researcher', emoji: '🔬', role: '市場・競品・技術研究', status: 'planned', model: 'Opus 4.6', color: '#9CA3AF' },
  { id: 'developer', name: 'Developer', emoji: '💻', role: 'Portal・腳本・API', status: 'planned', model: 'Opus 4.6', color: '#9CA3AF' },
  { id: 'editor', name: 'Editor', emoji: '✏️', role: 'Travis Daily・報告', status: 'planned', model: 'Opus 4.6', color: '#9CA3AF' },
]

const CRON_JOBS = [
  { time: '01:00', name: 'Pipeline 風險日報', agent: 'main', type: 'main' },
  { time: '02:00', name: 'OpenClaw 動態研究', agent: 'main', type: 'isolated' },
  { time: '02:30', name: 'Opus 4.6 版本檢查', agent: 'main', type: 'isolated' },
  { time: '03:00', name: 'Google Drive 備份', agent: 'main', type: 'main' },
  { time: '03:30', name: 'qmd 記憶同步', agent: 'main', type: 'main' },
  { time: '04:00', name: '硬碟巡檢', agent: 'main', type: 'main' },
  { time: '06:00', name: 'Materialized View 刷新', agent: 'main', type: 'main' },
  { time: '07:00', name: '行事曆同步', agent: 'secretary', type: 'spawn' },
  { time: '08:30', name: '郵件摘要 (工作日)', agent: 'secretary', type: 'spawn' },
  { time: '09:00', name: '每日任務提醒', agent: 'main', type: 'main' },
  { time: '09:00-18:00', name: '簽核檢查 (每30分)', agent: 'secretary', type: 'spawn' },
  { time: '10:30', name: 'LINE 業績週報 (工作日)', agent: 'main', type: 'main' },
  { time: '11:00/16:00', name: 'Funnel 同步 (工作日)', agent: 'main', type: 'isolated' },
  { time: '18:00', name: '晚間任務回顧', agent: 'main', type: 'main' },
]

interface TaskRun {
  id: number
  task_name: string
  agent: string
  status: 'running' | 'completed' | 'failed'
  result_text: string | null
  result_url: string | null
  error_message: string | null
  started_at: string
  completed_at: string | null
}

const RUN_STATUS: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  running:   { icon: '⏳', label: '執行中', color: '#D97706', bg: '#FEF3C7' },
  completed: { icon: '✅', label: '完成',   color: '#059669', bg: '#D1FAE5' },
  failed:    { icon: '❌', label: '失敗',   color: '#DC2626', bg: '#FEE2E2' },
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function fmtDateStr(d: Date) { return d.toISOString().split('T')[0] }

export default function AgentsPage() {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [loading, setLoading] = useState(true)
  // Task Runs
  const [runs, setRuns] = useState<TaskRun[]>([])
  const [runsLoading, setRunsLoading] = useState(true)
  const [runDate, setRunDate] = useState(fmtDateStr(new Date()))
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null)
  const [modalRun, setModalRun] = useState<TaskRun | null>(null)
  // Auth
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    // Check admin cookie
    const admin = document.cookie.split(';').some(c => c.trim().startsWith('is_admin=true'))
    setIsAdmin(admin)
    if (admin) {
      fetchTasks()
      const interval = setInterval(fetchTasks, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  const loadRuns = useCallback(async () => {
    
    const { data } = await supabase
      .from('task_runs')
      .select('*')
      .gte('started_at', `${runDate}T00:00:00+08:00`)
      .lte('started_at', `${runDate}T23:59:59+08:00`)
      .order('started_at', { ascending: false })
    if (data) setRuns(data)
    setRunsLoading(false)
  }, [runDate])

  useEffect(() => {
    if (isAdmin) { loadRuns(); const i = setInterval(loadRuns, 30000); return () => clearInterval(i) }
  }, [isAdmin, loadRuns])

  async function fetchTasks() {
    try {
      
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (!error && data) setTasks(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-gray-600 font-medium">需要超級管理員權限</p>
          <a href="/" className="text-sm text-blue-500 hover:underline mt-2 inline-block">返回首頁</a>
        </div>
      </div>
    )
  }
  if (isAdmin === null) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">載入中...</div>
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      planned: 'bg-gray-100 text-gray-500 border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      running: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    }
    const labels: Record<string, string> = {
      active: '運作中', planned: '規劃中', pending: '等待中',
      running: '執行中', completed: '已完成', failed: '失敗',
    }
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  const agentColor = (agentId: string) => {
    const a = AGENTS.find(a => a.id === agentId)
    return a?.color || '#6B7280'
  }

  const agentEmoji = (agentId: string) => {
    const a = AGENTS.find(a => a.id === agentId)
    return a?.emoji || '🔧'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">🤖 Multi-Agent 儀表板</h1>
              <p className="text-sm text-gray-500 mt-0.5">Jarvis 多 Agent 協作系統狀態</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Phase 1 — Secretary</div>
              <div className="text-xs text-gray-400">{new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Agent Cards */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Agent 狀態</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {AGENTS.map(agent => (
              <div
                key={agent.id}
                className={`bg-white rounded-lg border p-3 ${agent.status === 'active' ? 'border-l-4' : 'opacity-50'}`}
                style={agent.status === 'active' ? { borderLeftColor: agent.color } : {}}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{agent.emoji}</span>
                  <span className="font-semibold text-sm text-gray-900">{agent.name}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2 leading-tight">{agent.role}</p>
                <div className="flex items-center justify-between">
                  {statusBadge(agent.status)}
                  <span className="text-[10px] text-gray-400">{agent.model}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cron Schedule */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">⏰ 排程任務</h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-2 font-medium text-gray-600 w-32">時間</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">任務</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600 w-28">負責 Agent</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600 w-24">執行方式</th>
                  </tr>
                </thead>
                <tbody>
                  {CRON_JOBS.map((job, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">{job.time}</td>
                      <td className="px-4 py-2 text-gray-900">{job.name}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: agentColor(job.agent) }}>
                          {agentEmoji(job.agent)} {job.agent}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          job.type === 'spawn' ? 'bg-green-50 text-green-700' :
                          job.type === 'isolated' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {job.type === 'spawn' ? '🔀 spawn' : job.type === 'isolated' ? '📦 isolated' : '💬 main'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Task Runs 執行紀錄 */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-700">📋 任務執行紀錄</h2>
            <div className="flex gap-1.5 items-center">
              {[{ l: '昨天', v: fmtDateStr(new Date(Date.now() - 86400000)) }, { l: '今天', v: fmtDateStr(new Date()) }].map(b => (
                <button key={b.v} onClick={() => setRunDate(b.v)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${runDate === b.v ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >{b.l}</button>
              ))}
              <input type="date" value={runDate} onChange={e => setRunDate(e.target.value)}
                className="px-2 py-1 rounded-md border border-gray-300 text-xs" />
            </div>
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            {runsLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm">載入中...</div>
            ) : runs.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">{runDate === fmtDateStr(new Date()) ? '今天尚無任務紀錄' : '該日無紀錄'}</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {runs.map(run => {
                  const s = RUN_STATUS[run.status] || RUN_STATUS.running
                  const expanded = expandedRunId === run.id
                  const hasText = !!(run.result_text || run.error_message)
                  const hasUrl = !!run.result_url
                  const dur = run.completed_at ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000) : null

                  return (
                    <div key={run.id}>
                      <div
                        onClick={() => hasText && !hasUrl && setExpandedRunId(expanded ? null : run.id)}
                        className={`flex items-center gap-3 px-4 py-2.5 ${hasText && !hasUrl ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      >
                        <span className="text-xs font-mono text-gray-400 w-11 shrink-0">{fmtTime(run.started_at)}</span>
                        <span className="text-base">{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900">{run.task_name}</span>
                          <span className="text-xs text-gray-400 ml-2">{run.agent}{dur !== null ? ` · ${dur}s` : ''}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        {hasUrl ? (
                          <button onClick={e => { e.stopPropagation(); setModalRun(run) }} className="text-lg hover:scale-110 transition-transform" title="查看報告">📄</button>
                        ) : hasText ? (
                          <span className={`text-xs text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
                        ) : null}
                      </div>
                      {expanded && hasText && (
                        <div className="px-4 pb-3">
                          <pre className="p-3 rounded-lg bg-gray-50 text-xs leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto"
                            style={{ color: run.status === 'failed' ? '#DC2626' : '#374151' }}>
                            {run.status === 'failed' ? run.error_message : run.result_text}
                          </pre>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <p className="text-center text-xs text-gray-300 mt-2">每 30 秒自動刷新</p>
        </section>

        {/* Task Queue (agent_tasks) */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">🔄 任務佇列（agent_tasks）</h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">載入中...</div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-lg mb-1">尚無任務紀錄</p>
                <p className="text-xs">明天工作日 Cron 觸發後會開始記錄</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-2 font-medium text-gray-600">時間</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">類型</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Agent</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">狀態</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">耗時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => {
                      const duration = task.completed_at && task.started_at
                        ? Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 1000)
                        : null
                      return (
                        <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                            {new Date(task.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-2 text-gray-900">{task.task_type}</td>
                          <td className="px-4 py-2">
                            <span className="text-xs" style={{ color: agentColor(task.assigned_to) }}>
                              {agentEmoji(task.assigned_to)} {task.assigned_to}
                            </span>
                          </td>
                          <td className="px-4 py-2">{statusBadge(task.status)}</td>
                          <td className="px-4 py-2 text-xs text-gray-500">
                            {duration !== null ? `${duration}s` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Architecture Note */}
        <section className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">🏗️ 架構說明</h2>
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Phase 1（當前）</strong>：Jarvis (Coordinator) + Secretary Agent — 簽核/郵件/行事曆自動化</p>
            <p><strong>Phase 2</strong>：+ Analyst (Pipeline/業績) + Researcher (市場/技術)</p>
            <p><strong>Phase 3</strong>：+ Developer (Portal) + Editor (Travis Daily)</p>
            <p className="text-gray-400 mt-2">通訊方式：Cron → Jarvis (調度) → sessions_spawn → Secretary → Telegram 直接通知</p>
            <p className="text-gray-400">跨 Agent 協作透過 Supabase agent_tasks 任務佇列</p>
          </div>
        </section>
      </div>

      {/* 報告浮窗 */}
      {modalRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalRun(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{modalRun.task_name}</h3>
                <p className="text-xs text-gray-400">{modalRun.agent} · {fmtTime(modalRun.started_at)}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <a href={modalRun.result_url!} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">另開視窗 ↗</a>
                <button onClick={() => setModalRun(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>
            </div>
            <iframe src={modalRun.result_url!} className="flex-1 w-full border-0" style={{ minHeight: '60vh' }} />
          </div>
        </div>
      )}
    </div>
  )
}
