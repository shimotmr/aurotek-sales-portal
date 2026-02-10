'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Transcript {
  id: string
  title: string | null
  meeting_date: string | null
  duration_seconds: number | null
  status: string
  speakers: Record<string, string> | null
  assemblyai_id: string | null
  created_at: string
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  uploading: { label: '上傳中', color: '#D97706', bg: '#FEF3C7' },
  processing: { label: '轉錄中', color: '#2563EB', bg: '#DBEAFE' },
  ready: { label: '已完成', color: '#059669', bg: '#D1FAE5' },
  reviewed: { label: '已校閱', color: '#7C3AED', bg: '#EDE9FE' },
  error: { label: '錯誤', color: '#DC2626', bg: '#FEE2E2' },
}

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(true)
  const loadTranscripts = useCallback(async () => {
    const { data } = await supabase
      .from('transcripts')
      .select('id, title, meeting_date, duration_seconds, status, speakers, assemblyai_id, created_at')
      .order('created_at', { ascending: false })
    setTranscripts(data || [])
    setLoading(false)
  }, [])

  // Estimate progress based on elapsed time (typical transcription ~30-60% of audio length)
  const getProgress = (t: Transcript) => {
    if (t.status !== 'processing' && t.status !== 'uploading') return 100
    const elapsed = (Date.now() - new Date(t.created_at).getTime()) / 1000
    // Assume ~3 min for average transcription; logarithmic curve capping at 95%
    const progress = Math.min(95, Math.round((1 - Math.exp(-elapsed / 120)) * 100))
    return Math.max(5, progress)
  }

  // Poll processing transcripts
  const pollProgress = useCallback(async () => {
    const processing = transcripts.filter(t => t.status === 'processing' || t.status === 'uploading')
    if (processing.length === 0) return

    for (const t of processing) {
      if (!t.assemblyai_id) continue
      try {
        const res = await fetch(`/api/transcripts/${t.id}/status`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'ready' || data.status === 'error') {
            loadTranscripts()
            return
          }
        }
      } catch {}
    }
  }, [transcripts, loadTranscripts])

  useEffect(() => {
    loadTranscripts()
  }, [loadTranscripts])

  // Auto-refresh progress display + poll status
  const [, setTick] = useState(0)
  useEffect(() => {
    const hasProcessing = transcripts.some(t => t.status === 'processing' || t.status === 'uploading')
    if (!hasProcessing) return

    // Update display every 3s, poll API every 10s
    let pollCount = 0
    const interval = setInterval(() => {
      setTick(t => t + 1) // Force re-render to update time-based progress
      pollCount++
      if (pollCount % 3 === 0) pollProgress() // Poll every ~10s
    }, 3000)
    return () => clearInterval(interval)
  }, [transcripts, pollProgress])

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const formatDate = (d: string | null) => {
    if (!d) return '未設定'
    const date = new Date(d)
    return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`
  }

  const getSpeakerCount = (speakers: Record<string, string> | null) => {
    return speakers ? Object.keys(speakers).length : 0
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link href="/" style={{ color: '#9CA3AF' }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>🎤 逐字稿管理</h1>
            </div>
            <Link
              href="/transcripts/new"
              style={{ backgroundColor: '#2563EB', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}
            >
              + 新增
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>載入中...</div>
        ) : transcripts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎤</div>
            <p style={{ color: '#6B7280', marginBottom: '16px' }}>尚無逐字稿</p>
            <Link
              href="/transcripts/new"
              style={{ display: 'inline-block', backgroundColor: '#2563EB', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}
            >
              建立第一個逐字稿
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {transcripts.map(t => {
              const st = STATUS_MAP[t.status] || STATUS_MAP.ready
              const isProcessing = t.status === 'processing' || t.status === 'uploading'
              const progress = isProcessing ? getProgress(t) : 100

              return (
                <Link
                  key={t.id}
                  href={`/transcripts/${t.id}`}
                  style={{ display: 'block', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '16px', textDecoration: 'none', transition: 'box-shadow 0.2s', overflow: 'hidden', position: 'relative' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Progress bar for processing items */}
                  {isProcessing && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#E5E7EB' }}>
                      <div style={{ 
                        height: '100%', 
                        backgroundColor: '#2563EB', 
                        width: `${progress}%`,
                        transition: 'width 1s ease-in-out',
                        borderRadius: '0 2px 2px 0'
                      }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                        {t.title || `逐字稿 ${String(t.id).slice(0, 8)}`}
                      </span>
                      <span
                        style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: st.bg, color: st.color }}
                      >
                        {isProcessing ? `${st.label} ${progress}%` : st.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', color: '#2563EB', flexShrink: 0, marginLeft: '8px' }}>
                      {formatDuration(t.duration_seconds)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6B7280' }}>
                    <span>
                      {t.status === 'ready' || t.status === 'reviewed' 
                        ? `${getSpeakerCount(t.speakers)} 位說話者 · ${formatDate(t.meeting_date)}`
                        : formatDate(t.meeting_date)
                      }
                    </span>
                    <span>{formatDate(t.created_at)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
