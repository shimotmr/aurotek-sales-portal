'use client'

import {
  Bot, ClipboardList, Search, TrendingUp, Microscope,
  PenTool, Code2, Palette, Clock, RefreshCw, Package,
  MessageSquare, Building, ArrowLeft, Lock, FileText, GitFork
} from 'lucide-react'
import Link from 'next/link'
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

// Agent 顏色映射
const AGENT_COLORS: Record<string, string> = {
  main: '#4F46E5',
  secretary: '#059669',
  inspector: '#F59E0B',
  researcher: '#8B5CF6',
  writer: '#EC4899',
  analyst: '#EF4444',
  coder: '#DC2626',
  designer: '#D946EF',
}

// 模型顯示名稱
function fmtModel(m: string | null) {
  if (!m) return '—'
  if (m.includes('opus-4-6')) return 'Opus 4.6'
  if (m.includes('opus-4-5')) return 'Opus 4.5'
  if (m.includes('sonnet-4-5')) return 'Sonnet 4.5'
  if (m.includes('haiku-4-5')) return 'Haiku 4.5'
  return m
}

interface AgentDashboard {
  id: string
  name: string
  emoji: string
  role: string
  model_primary: string
  model_fallback: string
  cron_schedule: string
  last_run_at: string | null
  last_status: string | null
  runtime_status: 'active' | 'idle' | 'standby' | 'inactive'
  hours_since_last_run: number | null
}

const RUNTIME_STATUS_CONFIG: Record<string, { label: string; dot: string; border: string }> = {
  active:   { label: '活躍',  dot: 'bg-emerald-400', border: 'border-emerald-200' },
  idle:     { label: '閒置',  dot: 'bg-amber-400',   border: 'border-amber-200' },
  standby:  { label: '待命',  dot: 'bg-slate-300',   border: 'border-slate-200' },
  inactive: { label: '離線',  dot: 'bg-red-400',     border: 'border-red-200' },
}

const AGENT_ICONS: Record<string, any> = {
  main: Bot,
  secretary: ClipboardList,
  inspector: Search,
  researcher: Microscope,
  writer: PenTool,
  analyst: TrendingUp,
  coder: Code2,
  designer: Palette,
}

const AGENT_LETTERS: Record<string, string> = {
  main: 'J', secretary: 'S', inspector: 'I', researcher: 'R', writer: 'W', analyst: 'T', coder: 'C', designer: 'D',
}

// Compact colored badge: single letter + color dot
const AgentBadge = ({ agentId }: { agentId: string }) => {
  const letter = AGENT_LETTERS[agentId] || agentId?.[0]?.toUpperCase() || '?'
  const color = AGENT_COLORS[agentId] || '#6B7280'
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
      title={agentId}
    >{letter}</span>
  )
}

interface CronSchedule {
  id: string
  name: string
  schedule_expr: string
  schedule_tz: string
  agent_id: string
  enabled: boolean
  last_status: string | null
  last_run_at: string | null
  next_run_at: string | null
}

// Parse cron expression to human-readable time
function parseCronTime(expr: string): string {
  const parts = expr.split(/\s+/)
  if (parts.length < 5) return expr
  const [min, hour, , , ] = parts

  // Range like */30 in minute with hour range
  if (min.includes('/') && hour.includes('-')) {
    return `${hour} (每${min.split('/')[1]}分)`
  }
  if (min.includes('/') || hour === '*') return expr

  const hours = hour.split(',')
  const minute = min.padStart(2, '0')
  return hours.map(h => `${h.padStart(2, '0')}:${minute}`).join('/')
}

function parseCronDow(expr: string): '每日' | '工作日' | '自訂' {
  const dow = expr.split(/\s+/)[4]
  if (!dow || dow === '*') return '每日'
  if (dow === '1-5') return '工作日'
  return '自訂'
}

// Sort key: first hour from cron expr
function cronSortKey(expr: string): number {
  const parts = expr.split(/\s+/)
  if (parts.length < 2) return 9999
  const hour = parseInt(parts[1].split(',')[0].split('-')[0].split('/')[0])
  const min = parseInt(parts[0].split(',')[0].split('-')[0].split('/')[0])
  return (isNaN(hour) ? 99 : hour) * 60 + (isNaN(min) ? 0 : min)
}

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

const RUN_STATUS: Record<string, { label: string; color: string; bg: string; iconColor: string }> = {
  running:   { label: '執行中', color: '#D97706', bg: '#FEF3C7', iconColor: 'text-amber-500' },
  completed: { label: '完成',   color: '#059669', bg: '#D1FAE5', iconColor: 'text-emerald-500' },
  failed:    { label: '失敗',   color: '#DC2626', bg: '#FEE2E2', iconColor: 'text-red-500' },
}

const RunStatusIcon = ({ status }: { status: string }) => {
  if (status === 'running') return <svg className="w-4 h-4 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
  if (status === 'completed') return <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
  return <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function fmtDateStr(d: Date) { return d.toISOString().split('T')[0] }

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentDashboard[]>([])
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [loading, setLoading] = useState(true)
  // Task Runs
  const [runs, setRuns] = useState<TaskRun[]>([])
  const [runsLoading, setRunsLoading] = useState(true)
  const [runDate, setRunDate] = useState(fmtDateStr(new Date()))
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null)
  const [modalRun, setModalRun] = useState<TaskRun | null>(null)
  // Cron Schedules
  const [cronJobs, setCronJobs] = useState<CronSchedule[]>([])
  // Auth
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const loadAgents = useCallback(async () => {
    const { data } = await supabase.from('agents_dashboard').select('*')
    if (data) setAgents(data)
  }, [])

  const loadCronSchedules = useCallback(async () => {
    const { data } = await supabase.from('cron_schedules').select('*').eq('enabled', true)
    if (data) {
      const sorted = (data as CronSchedule[]).sort((a, b) => cronSortKey(a.schedule_expr) - cronSortKey(b.schedule_expr))
      setCronJobs(sorted)
    }
  }, [])

  useEffect(() => {
    // Check admin cookie
    const admin = document.cookie.split(';').some(c => c.trim().startsWith('is_admin=true'))
    setIsAdmin(admin)
    if (admin) {
      fetchTasks()
      loadAgents()
      loadCronSchedules()
      const interval = setInterval(() => { fetchTasks(); loadAgents(); loadCronSchedules() }, 30000)
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-300 mb-3 flex justify-center"><Lock size={20} /></div>
          <p className="text-slate-600 font-medium">需要超級管理員權限</p>
          <Link href="/" className="text-sm text-cyan-600 hover:underline mt-2 inline-block">返回首頁</Link>
        </div>
      </div>
    )
  }
  if (isAdmin === null) {
    return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center text-slate-400">載入中...</div>
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      planned: 'bg-slate-50 text-slate-500 border-slate-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      running: 'bg-sky-50 text-sky-700 border-sky-200',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
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

  const agentColor = (agentId: string) => AGENT_COLORS[agentId] || '#6B7280'

  const AgentIcon = ({ agentId, className }: { agentId: string; className?: string }) => {
    const Ic = AGENT_ICONS[agentId] || Bot
    return <span className={className}><Ic size={16} /></span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Page Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 md:top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white">
            <Bot size={16} />
          </div>
          <h1 className="text-base font-bold text-slate-900">Agent 中控台</h1>
          <div className="ml-auto text-xs text-slate-400">{new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Agent Cards */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Agent 狀態</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {agents.map(agent => {
              const color = AGENT_COLORS[agent.id] || '#6B7280'
              const rs = RUNTIME_STATUS_CONFIG[agent.runtime_status] || RUNTIME_STATUS_CONFIG.inactive
              const hoursAgo = agent.hours_since_last_run !== null ? Math.round(agent.hours_since_last_run) : null
              return (
                <div
                  key={agent.id}
                  className={`bg-white rounded-xl shadow-sm border border-slate-100 p-3 border-l-4`}
                  style={{ borderLeftColor: color }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-600"><AgentIcon agentId={agent.id} /></span>
                    <span className="font-semibold text-sm text-slate-900">{agent.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 leading-tight">{agent.role}</p>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border ${rs.border} bg-white`}>
                      <span className={`w-2 h-2 rounded-full ${rs.dot} ${agent.runtime_status === 'active' ? 'animate-pulse' : ''}`} />
                      {rs.label}
                    </span>
                    <span className="text-[10px] text-slate-400">{fmtModel(agent.model_primary)}</span>
                  </div>
                  {agent.last_status && (
                    <p className="text-[10px] text-slate-400 truncate" title={agent.last_status}>{agent.last_status}</p>
                  )}
                  {hoursAgo !== null && (
                    <p className="text-[10px] text-slate-300">{hoursAgo < 1 ? '剛剛執行' : `${hoursAgo}h 前`}</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Cron Schedule */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock size={16} /> 排程任務
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
            {cronJobs.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-4">載入中...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                {cronJobs.map(job => {
                  const dow = parseCronDow(job.schedule_expr)
                  return (
                    <div key={job.id} className="flex items-center gap-2 py-1 text-sm">
                      <span className="font-mono text-xs text-slate-400 w-[5.5rem] shrink-0">{parseCronTime(job.schedule_expr)}</span>
                      <span className="text-slate-800 truncate flex-1">{job.name}</span>
                      {dow === '工作日' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 shrink-0">工作日</span>}
                      <AgentBadge agentId={job.agent_id} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Task Runs 執行紀錄 */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList size={16} /> 任務執行紀錄
            </h2>
            <div className="flex gap-1.5 items-center">
              {[{ l: '昨天', v: fmtDateStr(new Date(Date.now() - 86400000)) }, { l: '今天', v: fmtDateStr(new Date()) }].map(b => (
                <button key={b.v} onClick={() => setRunDate(b.v)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${runDate === b.v ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >{b.l}</button>
              ))}
              <input type="date" value={runDate} onChange={e => setRunDate(e.target.value)}
                className="px-2 py-1 rounded-md border border-slate-200 text-xs" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {runsLoading ? (
              <div className="p-6 text-center text-slate-400 text-sm">載入中...</div>
            ) : runs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">{runDate === fmtDateStr(new Date()) ? '今天尚無任務紀錄' : '該日無紀錄'}</div>
            ) : (
              <div className="divide-y divide-slate-50">
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
                        className={`flex items-center gap-3 px-4 py-2.5 ${hasText && !hasUrl ? 'cursor-pointer hover:bg-slate-50/50' : ''}`}
                      >
                        <span className="text-xs font-mono text-slate-400 w-11 shrink-0">{fmtTime(run.started_at)}</span>
                        <RunStatusIcon status={run.status} />
                        <AgentBadge agentId={run.agent} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-900">{run.task_name}</span>
                          {dur !== null && <span className="text-xs text-slate-400 ml-2">{dur}s</span>}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        {hasUrl ? (
                          <button onClick={e => { e.stopPropagation(); setModalRun(run) }} className="text-slate-400 hover:text-slate-600 transition" title="查看報告"><FileText size={16} /></button>
                        ) : hasText ? (
                          <span className={`text-xs text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
                        ) : null}
                      </div>
                      {expanded && hasText && (
                        <div className="px-4 pb-3">
                          <pre className="p-3 rounded-lg bg-slate-50 text-xs leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto"
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
          <p className="text-center text-xs text-slate-300 mt-2">每 30 秒自動刷新</p>
        </section>

        {/* 任務佇列 agent_tasks */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <RefreshCw size={16} /> 任務佇列（agent_tasks）
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400">載入中...</div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-lg mb-1">尚無任務紀錄</p>
                <p className="text-xs">跨 Agent 協作任務會顯示在這裡</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tasks.map(task => {
                  const duration = task.completed_at && task.started_at
                    ? Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 1000)
                    : null
                  const desc = task.payload?.description || task.payload?.commit || null
                  return (
                    <div key={task.id} className="px-4 py-3 hover:bg-slate-50/50">
                      <div className="flex items-center gap-2 mb-1">
                        <AgentBadge agentId={task.assigned_to} />
                        <span className="text-sm font-medium text-slate-900">{task.task_type}</span>
                        <span className="ml-auto">{statusBadge(task.status)}</span>
                      </div>
                      {desc && (
                        <p className="text-xs text-slate-500 mb-1 line-clamp-2">{desc}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{new Date(task.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        {duration !== null && <span>{duration}s</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Architecture Note */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building size={16} /> 架構說明
          </h2>
          <div className="text-xs text-slate-500 space-y-1">
            <p><strong className="text-slate-700">Phase 1（已完成）</strong>：Travis + Secretary — 簽核/郵件/行事曆自動化</p>
            <p><strong className="text-slate-700">Phase 2（已完成）</strong>：+ Inspector + Researcher + Writer + Analyst + Coder + Designer（8 agents 全上線）</p>
            <p><strong className="text-slate-700">Phase 3（進行中）</strong>：</p>
            <div className="ml-4 space-y-0.5">
              <p>✅ agent_tasks 任務佇列（DB 追蹤派工狀態）</p>
              <p>✅ Designer→Coder→Inspector 開發流程</p>
              <p>✅ Researcher→Writer 報告流程</p>
              <p>🔄 Agent 間直接通訊（等 OpenClaw 支援）</p>
              <p>🔄 Agent 自主排程</p>
            </div>
            <p className="text-slate-400 mt-2">通訊方式：Cron → Travis (調度) → sessions_spawn → 各 Agent → Telegram 通知</p>
            <p className="text-slate-400">跨 Agent 協作透過 Supabase agent_tasks 任務佇列 + Travis Daily 留言討論</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 mt-8 pb-6">
          Aurotek Sales Portal · Powered by Travis
        </footer>
      </div>

      {/* 報告浮窗 */}
      {modalRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalRun(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{modalRun.task_name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1"><AgentBadge agentId={modalRun.agent} /> {fmtTime(modalRun.started_at)}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <a href={modalRun.result_url!} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition">另開視窗 ↗</a>
                <button onClick={() => setModalRun(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-lg">✕</button>
              </div>
            </div>
            <iframe src={modalRun.result_url!} className="flex-1 w-full border-0" style={{ minHeight: '60vh' }} />
          </div>
        </div>
      )}
    </div>
  )
}
