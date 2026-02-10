'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewTranscriptPage() {
  const router = useRouter()
  
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!['mp3', 'm4a', 'wav'].includes(ext || '')) {
        alert('僅支援 mp3、m4a、wav 格式')
        return
      }
      setAudioFile(file)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleSubmit = async () => {
    if (!audioFile) {
      alert('請選擇音檔')
      return
    }

    setUploading(true)
    try {
      // 1. 建立 transcript 記錄（status=uploading）
      const { data: transcript, error: createErr } = await supabase
        .from('transcripts')
        .insert({
          title: title || null,
          meeting_date: meetingDate || null,
          status: 'uploading',
          audio_filename: audioFile.name
        })
        .select()
        .single()

      if (createErr) throw createErr

      // 2. 上傳音檔到 Storage
      const filename = `${transcript.id}.${audioFile.name.split('.').pop()}`
      const { error: uploadErr } = await supabase.storage
        .from('transcripts')
        .upload(filename, audioFile)

      if (uploadErr) throw uploadErr

      // 3. 取得公開 URL
      const { data: urlData } = supabase.storage
        .from('transcripts')
        .getPublicUrl(filename)

      // 4. 呼叫 API 開始轉錄
      const formData = new FormData()
      formData.append('transcript_id', transcript.id)
      formData.append('audio_url', urlData.publicUrl)
      formData.append('title', title || '')
      formData.append('meeting_date', meetingDate || '')

      const res = await fetch('/api/transcripts/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }

      // 5. 跳轉到詳情頁
      router.push(`/transcripts/${transcript.id}`)
    } catch (err) {
      alert('上傳失敗：' + (err as Error).message)
      setUploading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/transcripts" style={{ color: '#9CA3AF' }}>
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>新增逐字稿</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={uploading || !audioFile}
            style={{ backgroundColor: '#2563EB', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: uploading || !audioFile ? 'not-allowed' : 'pointer', opacity: uploading || !audioFile ? 0.5 : 1 }}
          >
            {uploading ? '處理中...' : '🎙️ 開始轉錄'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '16px' }}>
        {/* Form */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f3f4f6', padding: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>📝 會議資訊</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>標題（選填）</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：2026/02 業務會議"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>會議日期（選填）</label>
            <input
              type="date"
              value={meetingDate}
              onChange={e => setMeetingDate(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>🎧 音檔上傳</h2>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{ display: 'block', width: '100%', padding: '24px', border: '2px dashed #D1D5DB', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#F9FAFB' }}
            >
              <input
                type="file"
                accept=".mp3,.m4a,.wav"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {audioFile ? (
                <>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎵</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                    {audioFile.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {formatFileSize(audioFile.size)}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                    點擊或拖曳音檔到此處
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    支援 MP3、M4A、WAV 格式
                  </div>
                </>
              )}
            </label>
          </div>

          {audioFile && (
            <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #DBEAFE' }}>
              <div style={{ fontSize: '12px', color: '#1E40AF' }}>
                ℹ️ 轉錄時間約為音檔長度的 30-50%，完成後會自動更新狀態
              </div>
            </div>
          )}
        </div>

        {/* Bottom Button */}
        <div style={{ paddingBottom: '32px', marginTop: '16px' }}>
          <button
            onClick={handleSubmit}
            disabled={uploading || !audioFile}
            style={{ width: '100%', backgroundColor: '#2563EB', color: 'white', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: uploading || !audioFile ? 'not-allowed' : 'pointer', opacity: uploading || !audioFile ? 0.5 : 1 }}
          >
            {uploading ? '🔄 處理中...' : '🎙️ 開始轉錄'}
          </button>
        </div>
      </div>
    </div>
  )
}
