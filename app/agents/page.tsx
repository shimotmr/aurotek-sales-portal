'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
  trader: '#EF4444',
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

/* SVG Icons */
const IconBot = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="8.5" cy="16" r="1.5"/><circle cx="15.5" cy="16" r="1.5"/><path d="M12 2v4M8 7h8a2 2 0 012 2v2H6v-2a2 2 0 012-2z"/></svg>
const IconClipboard = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
const IconChart = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 5-5"/></svg>
const IconSearch = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
const IconCode = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
const IconPen = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
const IconClock = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const IconRefresh = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
const IconBox = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
const IconChat = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const IconBuild = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M2 20h20M5 20V10l7-5 7 5v10"/><rect x="9" y="14" width="6" height="6"/></svg>
const IconArrowLeft = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
const IconLock = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const IconDoc = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
const IconFork = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M6 9v3a6 6 0 006 6h3"/></svg>

const AGENT_ICONS: Record<string, () => JSX.Element> = {
  main: IconBot,
  secretary: IconClipboard,
  inspector: IconSearch,
  researcher: IconChart,
  writer: IconPen,
  trader: IconChart,
  coder: IconCode,
  designer: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
}

const AGENT_LETTERS: Record<string, string> = {
  main: 'J', secretary: 'S', inspector: 'I', researcher: 'R', writer: 'W', trader: 'T', coder: 'C', designer: 'D',
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

const CRON_JOBS = [
  { time: '01:00', name: 'Pipeline 風險日報', agent: 'secretary', type: 'spawn' },
  { time: '02:00', name: 'AI 動態研究', agent: 'researcher', type: 'spawn' },
  { time: '02:30', name: 'OpenClaw 版本檢查', agent: 'inspector', type: 'spawn' },
  { time: '03:00', name: 'Google Drive 備份', agent: 'inspector', type: 'spawn' },
  { time: '03:30', name: 'qmd 記憶同步', agent: 'inspector', type: 'spawn' },
  { time: '04:00', name: '硬碟巡檢', agent: 'inspector', type: 'spawn' },
  { time: '06:00', name: 'MV 刷新', agent: 'inspector', type: 'spawn' },
  { time: '07:00', name: '行事曆同步', agent: 'secretary', type: 'spawn' },
  { time: '08:30', name: '郵件摘要', agent: 'secretary', type: 'spawn' },
  { time: '09:00', name: '每日任務提醒', agent: 'main', type: 'main' },
  { time: '09:00-18:00', name: '簽核檢查 (每30分)', agent: 'secretary', type: 'spawn' },
  { time: '10:30', name: 'LINE 業績週報', agent: 'secretary', type: 'spawn' },
  { time: '11:00/16:00', name: 'Funnel 同步', agent: 'secretary', type: 'spawn' },
  { time: '12:00', name: '每日系統巡視', agent: 'inspector', type: 'spawn' },
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
  // Auth
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const loadAgents = useCallback(async () => {
    const { data } = await supabase.from('agents_dashboard').select('*')
    if (data) setAgents(data)
  }, [])

  useEffect(() => {
    // Check admin cookie
    const admin = document.cookie.split(';').some(c => c.trim().startsWith('is_admin=true'))
    setIsAdmin(admin)
    if (admin) {
      fetchTasks()
      loadAgents()
      const interval = setInterval(() => { fetchTasks(); loadAgents() }, 30000)
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
          <div className="text-slate-300 mb-3 flex justify-center"><IconLock /></div>
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
    const Ic = AGENT_ICONS[agentId] || IconBot
    return <span className={className}><Ic /></span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Page Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 md:top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white">
            <IconBot />
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
            <IconClock /> 排程任務
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2 font-medium text-slate-500 w-32">時間</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-500">任務</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-500 w-28">負責 Agent</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-500 w-24">執行方式</th>
                  </tr>
                </thead>
                <tbody>
                  {CRON_JOBS.map((job, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-mono text-xs text-slate-500">{job.time}</td>
                      <td className="px-4 py-2 text-slate-900">{job.name}</td>
                      <td className="px-4 py-2">
                        <AgentBadge agentId={job.agent} />
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                          job.type === 'spawn' ? 'bg-emerald-50 text-emerald-700' :
                          job.type === 'isolated' ? 'bg-sky-50 text-sky-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {job.type === 'spawn' && <IconFork />}
                          {job.type === 'isolated' && <IconBox />}
                          {job.type === 'main' && <IconChat />}
                          {job.type}
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
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <IconClipboard /> 任務執行紀錄
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
                          <button onClick={e => { e.stopPropagation(); setModalRun(run) }} className="text-slate-400 hover:text-slate-600 transition" title="查看報告"><IconDoc /></button>
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
            <IconRefresh /> 任務佇列（agent_tasks）
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2 font-medium text-slate-500">時間</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">類型</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">Agent</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">狀態</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">耗時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => {
                      const duration = task.completed_at && task.started_at
                        ? Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 1000)
                        : null
                      return (
                        <tr key={task.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(task.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-2 text-slate-900">{task.task_type}</td>
                          <td className="px-4 py-2">
                            <AgentBadge agentId={task.assigned_to} />
                          </td>
                          <td className="px-4 py-2">{statusBadge(task.status)}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">
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
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <IconBuild /> 架構說明
          </h2>
          <div className="text-xs text-slate-500 space-y-1">
            <p><strong className="text-slate-700">Phase 1（已完成）</strong>：Jarvis + Secretary — 簽核/郵件/行事曆自動化</p>
            <p><strong className="text-slate-700">Phase 2（已完成）</strong>：+ Inspector (QA) + Researcher (研究) + Writer (內容) + Trader (交易)</p>
            <p><strong className="text-slate-700">Phase 3（規劃中）</strong>：跨 Agent 自動協作、Agent 自主排程</p>
            <p className="text-slate-400 mt-2">通訊方式：Cron → Jarvis (調度) → sessions_spawn → 各 Agent → Telegram 通知</p>
            <p className="text-slate-400">跨 Agent 協作透過 Supabase agent_tasks 任務佇列</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 mt-8 pb-6">
          Aurotek Sales Portal · Powered by Jarvis
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
