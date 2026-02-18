'use client'

import { useState } from 'react'

// STT 引擎配置
export interface STTEngine {
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

export const STT_ENGINES: STTEngine[] = [
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

interface STTEngineSelectorProps {
  selectedEngine: string
  onEngineChange: (engineId: string) => void
  audioFile?: File | null
  className?: string
}

export default function STTEngineSelector({ 
  selectedEngine, 
  onEngineChange, 
  audioFile,
  className = '' 
}: STTEngineSelectorProps) {
  const [showEngineDetails, setShowEngineDetails] = useState(false)
  const currentEngine = STT_ENGINES.find(e => e.id === selectedEngine) || STT_ENGINES[0]

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

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
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
            onClick={() => onEngineChange(engine.id)}
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
  )
}