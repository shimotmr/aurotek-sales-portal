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
  const [isMobile, setIsMobile] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [addToDict, setAddToDict] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [polishing, setPolishing] = useState(false)
  const [polishProgress, setPolishProgress] = useState(0)
  const [polishMessage, setPolishMessage] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null)

  useEffect(() => {
    loadTranscript()
    const interval = setInterval(() => {
      if (transcript?.status === 'processing') {
        checkStatus()
      }
    }, 5000)
    
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', checkMobile)
    }
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

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const seekToTime = (ms: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000
      audioRef.current.play()
      setIsPlaying(true)
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
      showToast('辭典校正完成')
      loadTranscript()
    } catch (err) {
      showToast('校正失敗：' + (err as Error).message)
    } finally {
      setCorrecting(false)
    }
  }

  const handleReplace = async () => {
    if (!searchText) {
      showToast('請輸入搜尋文字')
      return
    }
    
    setReplacing(true)
    try {
      const res = await fetch(`/api/transcripts/${id}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: searchText, replace: replaceText, addToDict })
      })
      
      if (!res.ok) throw new Error(await res.text())
      
      const data = await res.json()
      showToast(`已替換 ${data.replacedCount} 段${data.addedToDict ? '，並加入辭典' : ''}`)
      loadTranscript()
      setSearchText('')
      setReplaceText('')
      setAddToDict(false)
      setShowReplace(false)
    } catch (err) {
      showToast('取代失敗：' + (err as Error).message)
    } finally {
      setReplacing(false)
    }
  }

  const handlePolish = async () => {
    if (!confirm('AI 將修正標點、空格和語句，確認執行？')) return
    
    setPolishing(true)
    setPolishProgress(0)
    setPolishMessage('啟動中...')
    
    try {
      const res = await fetch(`/api/transcripts/${id}/polish`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const text = decoder.decode(value)
          const lines = text.split('\n').filter(l => l.startsWith('data: '))
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'progress') {
                setPolishProgress(data.progress)
                setPolishMessage(`${data.completed}/${data.total} 批次，已修正 ${data.polished} 段`)
              } else if (data.type === 'waiting') {
                setPolishMessage(data.message)
              } else if (data.type === 'done') {
                showToast(`AI 潤稿完成，修正了 ${data.polishedCount} 段`)
                loadTranscript()
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      showToast('潤稿失敗：' + (err as Error).message)
    } finally {
      setPolishing(false)
      setPolishProgress(0)
      setPolishMessage('')
    }
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
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

  const reassignSpeaker = async (segId: string, newSpeaker: string) => {
    await supabase
      .from('transcript_segments')
      .update({ speaker: newSpeaker })
      .eq('id', segId)
    setSegments(segments.map(s => s.id === segId ? { ...s, speaker: newSpeaker } : s))
    setEditingSpeakerId(null)
  }

  const allSpeakerLabels = transcript ? Object.keys(transcript.speakers || {}) : []

  const highlightText = (text: string) => {
    if (!searchText || !showReplace) return text
    
    const parts = text.split(new RegExp(`(${searchText})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === searchText.toLowerCase() 
        ? `<mark style="background:#FEF08A">${part}</mark>`
        : part
    ).join('')
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
  const headerHeight = isMobile ? (audioUrl ? '140px' : '60px') : (audioUrl ? '120px' : '60px')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingTop: headerHeight, paddingBottom: isMobile ? '70px' : '80px' }}>
      {/* Header + Audio Player - 固定頂部 */}
      <div style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
        borderBottom: '1px solid #e5e7eb', 
        position: 'fixed', 
        top: 0, 
        left: 0,
        right: 0,
        zIndex: 30 
      }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: isMobile ? '12px 12px' : '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', marginBottom: audioUrl ? (isMobile ? '12px' : '10px') : 0 }}>
            <Link href="/transcripts" style={{ color: '#9CA3AF', flexShrink: 0 }}>
              <svg style={{ width: isMobile ? '18px' : '20px', height: isMobile ? '18px' : '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 'bold', color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {transcript.title || `逐字稿 ${transcript.id.slice(0, 8)}`}
            </h1>
            <span
              style={{ 
                padding: isMobile ? '4px 10px' : '4px 12px',
                borderRadius: '9999px', 
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: '500', 
                backgroundColor: st.bg, 
                color: st.color,
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              {st.label}
            </span>
          </div>

          {/* 手機版：大播放器控制 */}
          {audioUrl && (
            <div style={{ backgroundColor: '#F9FAFB', borderRadius: '8px', padding: isMobile ? '12px' : '10px' }}>
              {isMobile ? (
                <div>
                  {/* 隱藏的 audio 元素 */}
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    style={{ display: 'none' }}
                  />
                  
                  {/* 自訂播放器 UI */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={handlePlayPause}
                      style={{ 
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: '#2563EB',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '6px' }}>
                        {formatTime(currentTime)} / {formatTime((transcript.duration_seconds || 0) * 1000)}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={(transcript.duration_seconds || 0) * 1000}
                        value={currentTime}
                        onInput={e => {
                          const time = parseInt((e.target as HTMLInputElement).value)
                          setCurrentTime(time)
                          if (audioRef.current) {
                            audioRef.current.currentTime = time / 1000
                          }
                        }}
                        onChange={e => {
                          const time = parseInt(e.target.value)
                          setCurrentTime(time)
                          if (audioRef.current) {
                            audioRef.current.currentTime = time / 1000
                          }
                        }}
                        style={{ 
                          width: '100%',
                          height: '6px',
                          borderRadius: '3px',
                          outline: 'none',
                          appearance: 'none',
                          background: `linear-gradient(to right, #2563EB 0%, #2563EB ${(currentTime / ((transcript.duration_seconds || 1) * 1000)) * 100}%, #E5E7EB ${(currentTime / ((transcript.duration_seconds || 1) * 1000)) * 100}%, #E5E7EB 100%)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  style={{ width: '100%', height: '40px' }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: isMobile ? '12px' : '16px' }}>
        {/* Info Card */}
        <div style={{ backgroundColor: 'white', borderRadius: isMobile ? '16px' : '12px', border: '1px solid #f3f4f6', padding: isMobile ? '20px' : '16px', marginBottom: isMobile ? '16px' : '16px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '16px' : '16px',
            fontSize: isMobile ? '15px' : '14px'
          }}>
            <div>
              <div style={{ color: '#6B7280', fontSize: isMobile ? '13px' : '12px', marginBottom: '6px' }}>會議日期</div>
              <div style={{ color: '#111827', fontWeight: '500' }}>{formatDate(transcript.meeting_date)}</div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: isMobile ? '13px' : '12px', marginBottom: '6px' }}>時長</div>
              <div style={{ color: '#111827', fontWeight: '500' }}>
                {transcript.duration_seconds ? formatTime(transcript.duration_seconds * 1000) : '--:--'}
              </div>
            </div>
            <div>
              <div style={{ color: '#6B7280', fontSize: isMobile ? '13px' : '12px', marginBottom: '6px' }}>建立時間</div>
              <div style={{ color: '#111827', fontWeight: '500' }}>{formatDate(transcript.created_at)}</div>
            </div>
          </div>

          {/* Speaker List — inline below info */}
          {transcript.speakers && Object.keys(transcript.speakers).length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              <div style={{ color: '#6B7280', fontSize: isMobile ? '13px' : '12px', marginBottom: '10px' }}>與會人員</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.keys(transcript.speakers).map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      fontSize: isMobile ? '13px' : '12px', 
                      color: '#9CA3AF', 
                      width: '80px',
                      flexShrink: 0
                    }}>
                      {label}
                    </span>
                    <input
                      type="text"
                      defaultValue={transcript.speakers?.[label] || label}
                      onBlur={e => updateSpeakerName(label, e.target.value)}
                      style={{ 
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        padding: isMobile ? '8px 12px' : '6px 10px',
                        fontSize: isMobile ? '15px' : '14px',
                        color: '#111827', 
                        fontWeight: '500', 
                        flex: 1,
                        minHeight: '40px'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {transcript.status === 'processing' && (
          <div style={{ backgroundColor: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: isMobile ? '16px' : '12px', padding: isMobile ? '20px' : '16px', marginBottom: isMobile ? '16px' : '16px', fontSize: isMobile ? '15px' : '14px', color: '#1E40AF', lineHeight: '1.5' }}>
            🔄 轉錄中... {polling && '(檢查狀態中)'}
          </div>
        )}

        {transcript.status === 'error' && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: isMobile ? '16px' : '12px', padding: isMobile ? '20px' : '16px', marginBottom: isMobile ? '16px' : '16px', fontSize: isMobile ? '15px' : '14px', color: '#991B1B', lineHeight: '1.5' }}>
            ❌ 轉錄失敗，請重新上傳
          </div>
        )}

        {/* Segments */}
        {segments.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: isMobile ? '16px' : '12px', border: '1px solid #f3f4f6', padding: isMobile ? '20px' : '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '20px' : '16px', gap: '12px' }}>
              <h2 style={{ fontSize: isMobile ? '15px' : '14px', fontWeight: 'bold', color: '#374151' }}>📝 逐字稿內容</h2>
              <button
                onClick={handleCorrect}
                disabled={correcting}
                style={{ 
                  backgroundColor: '#7C3AED', 
                  color: 'white', 
                  padding: isMobile ? '10px 16px' : '6px 12px',
                  borderRadius: '6px', 
                  fontSize: isMobile ? '14px' : '12px',
                  border: 'none', 
                  cursor: correcting ? 'not-allowed' : 'pointer', 
                  opacity: correcting ? 0.5 : 1,
                  minHeight: '44px',
                  whiteSpace: 'nowrap'
                }}
              >
                {correcting ? '校正中...' : '📚 辭典校正'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '12px' }}>
              {segments.map(seg => {
                const isActive = currentTime >= seg.start_ms && currentTime <= seg.end_ms
                const isEditing = editingId === seg.id
                const displayText = seg.edited_text || seg.text

                return (
                  <div
                    key={seg.id}
                    style={{
                      padding: isMobile ? '16px' : '12px',
                      borderRadius: isMobile ? '12px' : '8px',
                      backgroundColor: isActive ? '#EFF6FF' : '#F9FAFB',
                      border: isActive ? '2px solid #2563EB' : '1px solid #E5E7EB',
                      transition: 'all 0.2s',
                      minHeight: isMobile ? '80px' : 'auto'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: isMobile ? '12px' : '12px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                      <button
                        onClick={() => seekToTime(seg.start_ms)}
                        style={{ 
                          color: '#2563EB', 
                          fontSize: isMobile ? '14px' : '12px',
                          fontFamily: 'monospace', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          flexShrink: 0,
                          minHeight: '44px',
                          padding: isMobile ? '8px 12px' : '4px 8px',
                          fontWeight: '600'
                        }}
                      >
                        {formatTime(seg.start_ms)}
                      </button>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                          onClick={() => setEditingSpeakerId(editingSpeakerId === seg.id ? null : seg.id)}
                          style={{ 
                            fontSize: isMobile ? '14px' : '12px',
                            fontWeight: '600', 
                            color: '#7C3AED', 
                            background: editingSpeakerId === seg.id ? '#EDE9FE' : 'none',
                            border: '1px solid transparent',
                            borderRadius: '4px',
                            padding: isMobile ? '6px 10px' : '4px 8px',
                            cursor: 'pointer',
                            minHeight: isMobile ? '36px' : 'auto',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {getSpeakerName(seg.speaker)} ▾
                        </button>
                        {editingSpeakerId === seg.id && allSpeakerLabels.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 40,
                            minWidth: '140px',
                            overflow: 'hidden'
                          }}>
                            {allSpeakerLabels.map(label => (
                              <button
                                key={label}
                                onClick={() => reassignSpeaker(seg.id, label)}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: isMobile ? '12px 16px' : '8px 12px',
                                  fontSize: isMobile ? '15px' : '13px',
                                  border: 'none',
                                  backgroundColor: seg.speaker === label ? '#EDE9FE' : 'white',
                                  color: seg.speaker === label ? '#7C3AED' : '#374151',
                                  fontWeight: seg.speaker === label ? '600' : '400',
                                  cursor: 'pointer',
                                  minHeight: isMobile ? '44px' : 'auto'
                                }}
                              >
                                {getSpeakerName(label)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: isMobile ? '100%' : 'auto' }}>
                        {isEditing ? (
                          <textarea
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onBlur={() => handleEditSave(seg.id)}
                            autoFocus
                            style={{ 
                              width: '100%', 
                              padding: isMobile ? '12px' : '8px',
                              border: '1px solid #D1D5DB', 
                              borderRadius: '4px', 
                              fontSize: isMobile ? '16px' : '14px',
                              lineHeight: '1.6', 
                              minHeight: isMobile ? '100px' : '60px'
                            }}
                          />
                        ) : (
                          <div
                            onDoubleClick={() => handleEditStart(seg)}
                            style={{ 
                              fontSize: isMobile ? '15px' : '14px',
                              lineHeight: '1.7', 
                              color: '#111827', 
                              cursor: 'text',
                              padding: isMobile ? '4px 0' : '2px 0'
                            }}
                            dangerouslySetInnerHTML={{ __html: highlightText(displayText) }}
                          />
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => handleEditStart(seg)}
                          style={{ 
                            color: '#6B7280', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: isMobile ? '20px' : '14px',
                            minHeight: '44px',
                            minWidth: '44px',
                            flexShrink: 0
                          }}
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

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#111827',
          color: 'white',
          padding: isMobile ? '14px 24px' : '12px 20px',
          borderRadius: '8px',
          fontSize: isMobile ? '15px' : '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 50,
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          {toast}
        </div>
      )}

      {/* Replace Panel - 固定在底部工具列上方 */}
      {showReplace && segments.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '70px' : '80px',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '2px solid #2563EB',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
          zIndex: 25,
          padding: isMobile ? '16px' : '16px'
        }}>
          <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: isMobile ? '15px' : '14px', fontWeight: 'bold', color: '#111827' }}>🔍 批量取代</h3>
              <button
                onClick={() => setShowReplace(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '20px', 
                  cursor: 'pointer',
                  minHeight: '44px',
                  minWidth: '44px',
                  color: '#6B7280'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="搜尋文字..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '12px' : '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: isMobile ? '16px' : '14px',
                  minHeight: '44px'
                }}
              />
              <input
                type="text"
                placeholder="替換為..."
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '12px' : '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: isMobile ? '16px' : '14px',
                  minHeight: '44px'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}>
                <input
                  type="checkbox"
                  id="addToDict"
                  checked={addToDict}
                  onChange={e => setAddToDict(e.target.checked)}
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="addToDict" style={{ fontSize: isMobile ? '14px' : '13px', color: '#374151', cursor: 'pointer' }}>
                  同時加入辭典
                </label>
              </div>
              <button
                onClick={handleReplace}
                disabled={replacing || !searchText}
                style={{
                  backgroundColor: '#2563EB',
                  color: 'white',
                  padding: isMobile ? '12px' : '10px',
                  borderRadius: '6px',
                  fontSize: isMobile ? '15px' : '14px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: (replacing || !searchText) ? 'not-allowed' : 'pointer',
                  opacity: (replacing || !searchText) ? 0.5 : 1,
                  minHeight: '48px'
                }}
              >
                {replacing ? '⏳ 取代中...' : '執行取代'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Toolbar - 固定底部 */}
      {segments.length > 0 && (
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          backgroundColor: 'white', 
          borderTop: '1px solid #E5E7EB', 
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)', 
          zIndex: 20 
        }}>
          <div style={{ 
            maxWidth: '1024px', 
            margin: '0 auto', 
            padding: isMobile ? '12px' : '12px 16px'
          }}>
            {!isMobile && (
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>
                {segments.length} 個段落 · 點擊時間戳跳轉 · 雙擊文字編輯
              </div>
            )}
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '4px'
            }}>
              <button
                onClick={handleCorrect}
                disabled={correcting}
                style={{ 
                  backgroundColor: '#7C3AED', 
                  color: 'white', 
                  padding: isMobile ? '12px 16px' : '8px 16px',
                  borderRadius: '8px', 
                  fontSize: isMobile ? '15px' : '14px',
                  fontWeight: '500', 
                  border: 'none', 
                  cursor: correcting ? 'not-allowed' : 'pointer', 
                  opacity: correcting ? 0.5 : 1,
                  minHeight: '48px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {correcting ? '⏳ 校正中...' : '📚 辭典校正'}
              </button>
              <button
                onClick={() => setShowReplace(!showReplace)}
                style={{ 
                  backgroundColor: showReplace ? '#2563EB' : '#F3F4F6',
                  color: showReplace ? 'white' : '#374151',
                  padding: isMobile ? '12px 16px' : '8px 16px',
                  borderRadius: '8px', 
                  fontSize: isMobile ? '15px' : '14px',
                  fontWeight: '500', 
                  border: 'none', 
                  cursor: 'pointer',
                  minHeight: '48px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                🔍 批量取代
              </button>
              <button
                onClick={handlePolish}
                disabled={polishing}
                style={{ 
                  background: polishing ? '#9CA3AF' : 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                  color: 'white', 
                  padding: isMobile ? '12px 16px' : '8px 16px',
                  borderRadius: '8px', 
                  fontSize: isMobile ? '15px' : '14px',
                  fontWeight: '500', 
                  border: 'none', 
                  cursor: polishing ? 'not-allowed' : 'pointer',
                  minHeight: '48px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  minWidth: polishing ? '180px' : 'auto'
                }}
              >
                {polishing && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '4px',
                    backgroundColor: '#A855F7',
                    width: `${polishProgress}%`,
                    transition: 'width 0.5s ease'
                  }} />
                )}
                {polishing ? `⏳ ${polishProgress}% ${polishMessage}` : '✨ AI 潤稿'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
