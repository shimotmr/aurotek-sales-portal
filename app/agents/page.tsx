'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

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

export default function AgentsPage() {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchTasks() {
    try {
      const supabase = createClient()
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

        {/* Task History */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">📋 任務歷史（agent_tasks）</h2>
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
    </div>
  )
}
