'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface TaskRun {
  id: number
  task_name: string
  cron_job_id: string | null
  agent: string
  status: 'running' | 'completed' | 'failed'
  result_text: string | null
  error_message: string | null
  started_at: string
  completed_at: string | null
}

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  running:   { icon: '⏳', label: '執行中', color: '#D97706', bg: '#FEF3C7' },
  completed: { icon: '✅', label: '完成',   color: '#059669', bg: '#D1FAE5' },
  failed:    { icon: '❌', label: '失敗',   color: '#DC2626', bg: '#FEE2E2' },
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function MonitorPage() {
  const [runs, setRuns] = useState<TaskRun[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const loadRuns = useCallback(async () => {
    const startOfDay = `${selectedDate}T00:00:00+08:00`
    const endOfDay = `${selectedDate}T23:59:59+08:00`

    const { data } = await supabase
      .from('task_runs')
      .select('*')
      .gte('started_at', startOfDay)
      .lte('started_at', endOfDay)
      .order('started_at', { ascending: false })

    if (data) setRuns(data)
    setLoading(false)
  }, [selectedDate])

  useEffect(() => {
    loadRuns()
    const interval = setInterval(loadRuns, 30000) // 每30秒刷新
    return () => clearInterval(interval)
  }, [loadRuns])

  const today = formatDate(new Date())
  const yesterday = formatDate(new Date(Date.now() - 86400000))

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📋 任務監控</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setSelectedDate(yesterday)}
            style={{
              padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13,
              background: selectedDate === yesterday ? '#3B82F6' : '#fff',
              color: selectedDate === yesterday ? '#fff' : '#374151',
              cursor: 'pointer'
            }}
          >昨天</button>
          <button
            onClick={() => setSelectedDate(today)}
            style={{
              padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13,
              background: selectedDate === today ? '#3B82F6' : '#fff',
              color: selectedDate === today ? '#fff' : '#374151',
              cursor: 'pointer'
            }}
          >今天</button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>載入中...</div>
      ) : runs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
          {selectedDate === today ? '今天尚無任務執行紀錄' : '該日無紀錄'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {runs.map((run) => {
            const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.running
            const isExpanded = expandedId === run.id
            const hasResult = !!(run.result_text || run.error_message)

            return (
              <div key={run.id} style={{
                border: '1px solid #E5E7EB', borderRadius: 10,
                background: '#fff', overflow: 'hidden'
              }}>
                <div
                  onClick={() => hasResult && setExpandedId(isExpanded ? null : run.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    cursor: hasResult ? 'pointer' : 'default',
                  }}
                >
                  {/* 時間 */}
                  <span style={{ fontSize: 14, fontFamily: 'monospace', color: '#6B7280', minWidth: 48 }}>
                    {formatTime(run.started_at)}
                  </span>

                  {/* 狀態 icon */}
                  <span style={{ fontSize: 18 }}>{cfg.icon}</span>

                  {/* 任務名 + agent */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{run.task_name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {run.agent}
                      {run.completed_at && ` · ${Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`}
                    </div>
                  </div>

                  {/* 狀態 badge */}
                  <span style={{
                    fontSize: 12, padding: '2px 8px', borderRadius: 12,
                    background: cfg.bg, color: cfg.color, fontWeight: 500, whiteSpace: 'nowrap'
                  }}>
                    {cfg.label}
                  </span>

                  {/* 展開箭頭 */}
                  {hasResult && (
                    <span style={{ fontSize: 12, color: '#9CA3AF', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : '' }}>
                      ▼
                    </span>
                  )}
                </div>

                {/* 展開內容 */}
                {isExpanded && (
                  <div style={{
                    padding: '0 16px 14px', borderTop: '1px solid #F3F4F6',
                  }}>
                    <pre style={{
                      margin: '12px 0 0', padding: 12, borderRadius: 8,
                      background: '#F9FAFB', fontSize: 13, lineHeight: 1.6,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      color: run.status === 'failed' ? '#DC2626' : '#374151',
                      maxHeight: 400, overflowY: 'auto'
                    }}>
                      {run.status === 'failed' ? run.error_message : run.result_text}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#D1D5DB' }}>
        每 30 秒自動刷新
      </div>
    </div>
  )
}
