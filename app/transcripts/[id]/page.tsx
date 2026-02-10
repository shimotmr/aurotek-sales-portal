'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Transcript {
  id: string
  title: string | null
  meeting_date: string | null
  duration_seconds: number | null
  audio_filename: string | null
  status: string
  speakers: Record<string, string> | null
  created_at: string
}

interface Segment {
  id: string
  transcript_id: string
  speaker: string
  text: string
  edited_text: string | null
  start_ms: number
  end_ms: number
  confidence: number | null
  is_reviewed: boolean
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  uploading: { label: '上傳中', color: '#D97706', bg: '#FEF3C7' },
  processing: { label: '轉錄中', color: '#2563EB', bg: '#DBEAFE' },
  ready: { label: '已完成', color: '#059669', bg: '#D1FAE5' },
  reviewed: { label: '已校閱', color: '#7C3AED', bg: '#EDE9FE' },
  error: { label: '錯誤', color: '#DC2626', bg: '#FEE2E2' },
}

export default function TranscriptDetailPage() {
  const params = useParams()
  const id = params.id as string
  const audioRef = useRef<HTMLAudioElement>(null)

  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [correcting, setCorrecting] = useState(false)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    loadTranscript()
    const interval = setInterval(() => {
      if (transcript?.status === 'processing') {
        checkStatus()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [id, transcript?.status])

  const loadTranscript = async () => {
    setLoading(true)
    
    // Load transcript
    const { data: t } = await supabase
      .from('transcripts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (t) {
      setTranscript(t)
      
      // Load audio URL
      if (t.audio_filename) {
        const filename = `${t.id}.${t.audio_filename.split('.').pop()}`
        const { data: urlData } = supabase.storage
          .from('transcripts')
          .getPublicUrl(filename)
        setAudioUrl(urlData.publicUrl)
      }
      
      // Load segments
      const { data: segs } = await supabase
        .from('transcript_segments')
        .select('*')
        .eq('transcript_id', id)
        .order('start_ms', { ascending: true })
      
      setSegments(segs || [])
    }
    
    setLoading(false)
  }

  const checkStatus = async () => {
    setPolling(true)
    const res = await fetch(`/api/transcripts/${id}/status`)
    if (res.ok) {
      const data = await res.json()
      if (data.status !== transcript?.status) {
        loadTranscript()
      }
    }
    setPolling(false)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime * 1000)
    }
  }

  const seekToTime = (ms: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000
      audioRef.current.play()
    }
  }

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatDate = (d: string | null) => {
    if (!d) return '未設定'
    const date = new Date(d)
    return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`
  }

  const handleEditStart = (seg: Segment) => {
    setEditingId(seg.id)
    setEditingText(seg.edited_text || seg.text)
  }

  const handleEditSave = async (segId: string) => {
    await supabase
      .from('transcript_segments')
      .update({ edited_text: editingText })
      .eq('id', segId)
    
    setSegments(segments.map(s => s.id === segId ? { ...s, edited_text: editingText } : s))
    setEditingId(null)
  }

  const handleCorrect = async () => {
    setCorrecting(true)
    try {
      const res = await fetch(`/api/transcripts/${id}/correct`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      alert('辭典校正完成')
      loadTranscript()
    } catch (err) {
      alert('校正失敗：' + (err as Error).message)
    } finally {
      setCorrecting(false)
    }
  }

  const updateSpeakerName = async (oldLabel: string, newName: string) => {
    if (!newName || !transcript) return
    
    const newSpeakers = { ...(transcript.speakers || {}), [oldLabel]: newName }
    await supabase
      .from('transcripts')
      .update({ speakers: newSpeakers })
      .eq('id', id)
    
    setTranscript({ ...transcript, speakers: newSpeakers })
  }

  const getSpeakerName = (label: string) => {
    return transcript?.speakers?.[label] || label
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9CA3AF' }}>
        載入中...
      </div>
    )
  }

  if (!transcript) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#DC2626' }}>
        找不到逐字稿
      </div>
    )
  }

  const st = STATUS_MAP[transcript.status] || STATUS_MAP.ready

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Link href="/transcripts" style={{ color: '#9CA3AF' }}>
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', flex: 1 }}>
              {transcript.title || `逐字稿 ${transcript.id.slice(0, 8)}`}
            </h1>
            <span
              style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: st.bg, color: st.color }}
            >
              {st.label}
            </span>
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '12px' }}>
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                onTimeUpdate={handleTimeUpdate}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '16px' }}>
        {/* Info Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
            <div>
              <div style={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}>會議日期</div>
              <div style={{ color: '#111827', fontWeight: '500' }}>{formatDate(transcript.meeting_date)}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}>時長</div>
              <div style={{ color: '#111827', fontWeight: '500' }}>
                {transcript.duration_seconds ? formatTime(transcript.duration_seconds * 1000) : '--:--'}
              </div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}>建立時間</div>
              <div style={{ color: '#111827', fontWeight: '500' }}>{formatDate(transcript.created_at)}</div>
            </div>
          </div>
        </div>

        {/* Speaker Labels */}
        {transcript.speakers && Object.keys(transcript.speakers).length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '16px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>👥 說話者標籤</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.keys(transcript.speakers).map(label => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>{label}</span>
                  <span style={{ fontSize: '12px', color: '#111827' }}>→</span>
                  <input
                    type="text"
                    defaultValue={transcript.speakers[label]}
                    onBlur={e => updateSpeakerName(label, e.target.value)}
                    style={{ border: 'none', backgroundColor: 'transparent', fontSize: '12px', color: '#2563EB', fontWeight: '500', width: '80px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {transcript.status === 'processing' && (
          <div style={{ backgroundColor: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: '12px', padding: '16px', marginBottom: '16px', fontSize: '14px', color: '#1E40AF' }}>
            🔄 轉錄中... {polling && '(檢查狀態中)'}
          </div>
        )}

        {transcript.status === 'error' && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '16px', marginBottom: '16px', fontSize: '14px', color: '#991B1B' }}>
            ❌ 轉錄失敗，請重新上傳
          </div>
        )}

        {/* Segments */}
        {segments.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>📝 逐字稿內容</h2>
              <button
                onClick={handleCorrect}
                disabled={correcting}
                style={{ backgroundColor: '#7C3AED', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', border: 'none', cursor: correcting ? 'not-allowed' : 'pointer', opacity: correcting ? 0.5 : 1 }}
              >
                {correcting ? '校正中...' : '📚 辭典校正'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {segments.map(seg => {
                const isActive = currentTime >= seg.start_ms && currentTime <= seg.end_ms
                const isEditing = editingId === seg.id
                const displayText = seg.edited_text || seg.text

                return (
                  <div
                    key={seg.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? '#EFF6FF' : '#F9FAFB',
                      border: isActive ? '2px solid #2563EB' : '1px solid #E5E7EB',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <button
                        onClick={() => seekToTime(seg.start_ms)}
                        style={{ color: '#2563EB', fontSize: '12px', fontFamily: 'monospace', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                      >
                        {formatTime(seg.start_ms)}
                      </button>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#7C3AED', flexShrink: 0 }}>
                        {getSpeakerName(seg.speaker)}
                      </span>
                      <div style={{ flex: 1 }}>
                        {isEditing ? (
                          <textarea
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onBlur={() => handleEditSave(seg.id)}
                            autoFocus
                            style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '14px', lineHeight: '1.6', minHeight: '60px' }}
                          />
                        ) : (
                          <div
                            onDoubleClick={() => handleEditStart(seg)}
                            style={{ fontSize: '14px', lineHeight: '1.6', color: '#111827', cursor: 'text' }}
                          >
                            {displayText}
                          </div>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => handleEditStart(seg)}
                          style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      {segments.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid #E5E7EB', boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', zIndex: 10 }}>
          <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              {segments.length} 個段落 · 點擊時間戳跳轉 · 雙擊文字編輯
            </div>
            <button
              onClick={handleCorrect}
              disabled={correcting}
              style={{ backgroundColor: '#7C3AED', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: correcting ? 'not-allowed' : 'pointer', opacity: correcting ? 0.5 : 1 }}
            >
              {correcting ? '⏳ 校正中...' : '📚 辭典校正'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
