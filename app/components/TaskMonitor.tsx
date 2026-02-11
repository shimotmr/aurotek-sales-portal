'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

const STATUS: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  running:   { icon: '⏳', label: '執行中', color: '#D97706', bg: '#FEF3C7' },
  completed: { icon: '✅', label: '完成',   color: '#059669', bg: '#D1FAE5' },
  failed:    { icon: '❌', label: '失敗',   color: '#DC2626', bg: '#FEE2E2' },
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtDate(d: Date) { return d.toISOString().split('T')[0] }

export default function TaskMonitor() {
  const [runs, setRuns] = useState<TaskRun[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(fmtDate(new Date()))
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('task_runs')
      .select('*')
      .gte('started_at', `${date}T00:00:00+08:00`)
      .lte('started_at', `${date}T23:59:59+08:00`)
      .order('started_at', { ascending: false })
    if (data) setRuns(data)
    setLoading(false)
  }, [date])

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i) }, [load])

  const today = fmtDate(new Date())
  const yesterday = fmtDate(new Date(Date.now() - 86400000))

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">🤖 Agent 任務監控</h2>
        <div className="flex gap-1.5 items-center">
          {[{ l: '昨天', v: yesterday }, { l: '今天', v: today }].map(b => (
            <button key={b.v} onClick={() => setDate(b.v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${date === b.v ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >{b.l}</button>
          ))}
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-2 py-1 rounded-md border border-gray-300 text-xs" />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">載入中...</p>
      ) : runs.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">{date === today ? '今天尚無任務紀錄' : '該日無紀錄'}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {runs.map(run => {
            const s = STATUS[run.status] || STATUS.running
            const expanded = expandedId === run.id
            const hasText = !!(run.result_text || run.error_message)
            const hasUrl = !!run.result_url

            return (
              <div key={run.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  onClick={() => hasText && !hasUrl && setExpandedId(expanded ? null : run.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 ${hasText && !hasUrl ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                >
                  <span className="text-xs font-mono text-gray-400 w-11 shrink-0">{fmtTime(run.started_at)}</span>
                  <span className="text-base">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{run.task_name}</div>
                    <div className="text-xs text-gray-400">
                      {run.agent}
                      {run.completed_at && ` · ${Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  {hasUrl ? (
                    <a href={run.result_url!} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()} className="text-lg" title="查看報告">📄</a>
                  ) : hasText ? (
                    <span className={`text-xs text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
                  ) : null}
                </div>
                {expanded && hasText && (
                  <div className="px-3 pb-3 border-t border-gray-100">
                    <pre className="mt-2 p-3 rounded-lg bg-gray-50 text-xs leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto"
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
      <p className="text-center text-xs text-gray-300 mt-3">每 30 秒自動刷新</p>
    </div>
  )
}
