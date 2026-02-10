'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Transcript {
  id: string
  title: string | null
  meeting_date: string | null
  duration_seconds: number | null
  status: string
  speakers: Record<string, string> | null
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

  useEffect(() => {
    loadTranscripts()
  }, [])

  const loadTranscripts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('transcripts')
      .select('id, title, meeting_date, duration_seconds, status, speakers, created_at')
      .order('created_at', { ascending: false })
    setTranscripts(data || [])
    setLoading(false)
  }

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
              + 新增逐字稿
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '16px' }}>
        {/* List */}
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
              return (
                <Link
                  key={t.id}
                  href={`/transcripts/${t.id}`}
                  style={{ display: 'block', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '16px', textDecoration: 'none', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                        {t.title || `逐字稿 ${t.id.slice(0, 8)}`}
                      </span>
                      <span
                        style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', color: '#2563EB' }}>
                      {formatDuration(t.duration_seconds)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6B7280' }}>
                    <span>
                      {getSpeakerCount(t.speakers)} 位說話者 · {formatDate(t.meeting_date)}
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
