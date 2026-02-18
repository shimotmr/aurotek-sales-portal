'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { supabase } from '@/lib/supabase'

// STT 引擎配置
interface STTEngine {
  id: string
  name: string
  type: 'local' | 'cloud'
  description: string
  features: string[]
  supportedFormats: string[]
  pricing: {
    free: boolean
    cost?: string
    freeLimit?: string
  }
  processingTime: string
  accuracy: string
  advantages: string[]
  limitations: string[]
  icon: string
  recommended?: boolean
}

const STT_ENGINES: STTEngine[] = [
  {
    id: 'local-whisper',
    name: 'Local Whisper',
    type: 'local',
    description: '本地處理，保護隱私',
    features: ['離線處理', '完全免費', '隱私保護', '中文優化'],
    supportedFormats: ['MP3', 'M4A', 'WAV', 'FLAC'],
    pricing: {
      free: true,
      freeLimit: '無限制'
    },
    processingTime: '約音檔時長的 40-60%',
    accuracy: '85-90%',
    advantages: [
      '完全免費使用',
      '資料不上傳外部',
      '離線可用',
      '支援多種格式'
    ],
    limitations: [
      '需要本地運算資源',
      '處理較慢',
      '準確率略低於雲端'
    ],
    icon: '🏠',
    recommended: false
  },
  {
    id: 'assemblyai',
    name: 'AssemblyAI',
    type: 'cloud',
    description: '雲端處理，高精準度',
    features: ['說話者識別', '關鍵字提升', '實時處理', '高準確率'],
    supportedFormats: ['MP3', 'M4A', 'WAV', 'MP4'],
    pricing: {
      free: false,
      cost: '$0.15/小時',
      freeLimit: '免費額度 185 小時'
    },
    processingTime: '約音檔時長的 20-30%',
    accuracy: '92-96%',
    advantages: [
      '準確率最高',
      '自動說話者標記',
      '處理速度快',
      '支援關鍵字優化'
    ],
    limitations: [
      '需要網路連線',
      '超出免費額度需付費',
      '資料需上傳雲端'
    ],
    icon: '☁️',
    recommended: true
  }
]

export default function NewTranscriptPage() {
  const router = useRouter()
  
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [selectedEngine, setSelectedEngine] = useState<string>('assemblyai')
  const [uploading, setUploading] = useState(false)
  const [showEngineDetails, setShowEngineDetails] = useState(false)

  const currentEngine = STT_ENGINES.find(e => e.id === selectedEngine) || STT_ENGINES[0]

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

  const calculateEstimatedCost = (audioFile: File | null) => {
    if (!audioFile || currentEngine.pricing.free) return '免費'
    
    // 估算音檔時長（假設每 MB 約 1 分鐘，這是粗略估算）
    const estimatedMinutes = audioFile.size / (1024 * 1024)
    const estimatedHours = estimatedMinutes / 60
    
    if (currentEngine.id === 'assemblyai') {
      const cost = estimatedHours * 0.15
      return `約 $${cost.toFixed(3)} USD`
    }
    
    return '免費'
  }

  const calculateEstimatedTime = (audioFile: File | null) => {
    if (!audioFile) return '未知'
    
    // 估算音檔時長
    const estimatedMinutes = audioFile.size / (1024 * 1024)
    
    let processingRatio: number
    if (currentEngine.id === 'local-whisper') {
      processingRatio = 0.5 // 50% of audio length
    } else {
      processingRatio = 0.25 // 25% of audio length
    }
    
    const processingMinutes = Math.ceil(estimatedMinutes * processingRatio)
    return `約 ${processingMinutes} 分鐘`
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
          audio_filename: audioFile.name,
          engine_id: selectedEngine
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

      // 4. 呼叫 API 開始轉錄（包含引擎選擇）
      const formData = new FormData()
      formData.append('transcript_id', transcript.id)
      formData.append('audio_url', urlData.publicUrl)
      formData.append('engine', selectedEngine) // 新增引擎參數
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

      // 5. 跳轉到列表頁（背景繼續轉錄，不阻塞用戶）
      router.push('/transcripts')
    } catch (err) {
      alert('上傳失敗：' + (err as Error).message)
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Page Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 md:top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/transcripts" className="text-slate-400 hover:text-slate-600 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/></svg>
            </div>
            <span className="font-bold text-slate-800 text-sm sm:text-base">新增逐字稿</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={uploading || !audioFile}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              uploading || !audioFile
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            {uploading ? '處理中...' : '開始轉錄'}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* STT Engine Selection */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              🤖 選擇轉錄引擎
            </h2>
            <button
              onClick={() => setShowEngineDetails(!showEngineDetails)}
              className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
            >
              {showEngineDetails ? '隱藏詳情' : '顯示詳情'}
            </button>
          </div>

          {/* Engine Selection Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {STT_ENGINES.map((engine) => (
              <div
                key={engine.id}
                onClick={() => setSelectedEngine(engine.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedEngine === engine.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                } ${engine.recommended ? 'ring-2 ring-amber-200' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{engine.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        {engine.name}
                        {engine.recommended && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            推薦
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-600">{engine.description}</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedEngine === engine.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300'
                  }`}>
                    {selectedEngine === engine.id && (
                      <div className="w-full h-full bg-white rounded-full scale-50"></div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">準確率:</span>
                    <span className="ml-1 font-medium">{engine.accuracy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">處理時間:</span>
                    <span className="ml-1 font-medium">{engine.processingTime}</span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {engine.features.slice(0, 3).map((feature) => (
                    <span key={feature} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Engine Information */}
          {showEngineDetails && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                {currentEngine.icon} {currentEngine.name} 詳細資訊
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-slate-700 mb-2">✅ 優點</h5>
                  <ul className="space-y-1">
                    {currentEngine.advantages.map((advantage, index) => (
                      <li key={index} className="text-slate-600 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        {advantage}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-slate-700 mb-2">⚠️ 限制</h5>
                  <ul className="space-y-1">
                    {currentEngine.limitations.map((limitation, index) => (
                      <li key={index} className="text-slate-600 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">支援格式:</span>
                    <p className="font-medium">{currentEngine.supportedFormats.join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">定價:</span>
                    <p className="font-medium">
                      {currentEngine.pricing.free 
                        ? `免費 (${currentEngine.pricing.freeLimit})`
                        : `${currentEngine.pricing.cost} (${currentEngine.pricing.freeLimit})`
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">類型:</span>
                    <p className="font-medium">{currentEngine.type === 'local' ? '本地處理' : '雲端處理'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cost & Time Estimation */}
          {audioFile && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                📊 預估資訊
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">預估費用:</span>
                  <span className="ml-2 font-semibold text-blue-800">
                    {calculateEstimatedCost(audioFile)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">預估時間:</span>
                  <span className="ml-2 font-semibold text-blue-800">
                    {calculateEstimatedTime(audioFile)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Meeting Information Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            📝 會議資訊
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-2">標題（選填）</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="例如：2026/02 業務會議"
                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2">會議日期（選填）</label>
              <input
                type="date"
                value={meetingDate}
                onChange={e => setMeetingDate(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Audio Upload */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            🎧 音檔上傳
          </h2>

          <label className="block w-full p-8 border-2 border-dashed border-slate-300 rounded-lg text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
            <input
              type="file"
              accept=".mp3,.m4a,.wav"
              onChange={handleFileChange}
              className="hidden"
            />
            {audioFile ? (
              <>
                <div className="text-4xl mb-3">🎵</div>
                <div className="text-base font-semibold text-slate-800 mb-2">
                  {audioFile.name}
                </div>
                <div className="text-sm text-slate-600">
                  {formatFileSize(audioFile.size)}
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">📁</div>
                <div className="text-base text-slate-600 mb-2">
                  點擊或拖曳音檔到此處
                </div>
                <div className="text-sm text-slate-500">
                  支援 {currentEngine.supportedFormats.join('、')} 格式
                </div>
              </>
            )}
          </label>

          {audioFile && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-800 flex items-center gap-2">
                <span>✅</span>
                檔案已選取，使用 <strong>{currentEngine.name}</strong> 引擎轉錄
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={uploading || !audioFile}
          className={`w-full py-4 rounded-xl text-base font-bold transition-all ${
            uploading || !audioFile
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {uploading 
            ? '🔄 處理中...' 
            : `🎙️ 使用 ${currentEngine.name} 開始轉錄`
          }
        </button>
      </div>
    </div>
  )
}
