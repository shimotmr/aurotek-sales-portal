'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'

export default function SyncPage() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; details?: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 檢查檔案類型
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setResult({ success: false, message: '請上傳 Excel 檔案 (.xlsx 或 .xls)' })
        return
      }
      setSelectedFile(file)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setResult({ success: false, message: '請先選擇檔案' })
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/sync/upload-funnel', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: '上傳失敗，請稍後再試',
        details: String(error)
      })
    }

    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/admin" className="text-slate-400 hover:text-slate-700 transition">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
          </Link>
          <span className="text-lg bg-gradient-to-br from-gray-600 to-gray-800 bg-clip-text text-transparent">🔄</span>
          <h1 className="text-lg font-bold text-slate-800">資料同步</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 上傳 Funnel 報表 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            📤 上傳 Funnel 案件進度表
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            上傳從郵件收到的「Funnel案件進度表_通路營業部.xlsx」，系統會自動更新案件資料。
          </p>

          {/* 檔案選擇 */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 hover:border-blue-400 transition">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="funnel-upload"
            />
            <label htmlFor="funnel-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📁</div>
              {selectedFile ? (
                <div>
                  <p className="text-green-600 font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">點擊選擇檔案或拖放到此處</p>
                  <p className="text-sm text-gray-400">支援 .xlsx, .xls</p>
                </div>
              )}
            </label>
          </div>

          {/* 上傳按鈕 */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`w-full py-3 rounded-lg font-medium transition ${
              !selectedFile || uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> 處理中...
              </span>
            ) : (
              '📤 上傳並更新資料'
            )}
          </button>

          {/* 結果顯示 */}
          {result && (
            <div className={`mt-4 p-4 rounded-lg ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.success ? '✅ ' : '❌ '}{result.message}
              </div>
              {result.details && (
                <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">{result.details}</pre>
              )}
            </div>
          )}
        </div>

        {/* 同步狀態 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 size={20} /> 同步狀態</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">案件進度表</div>
                <div className="text-sm text-gray-500">Funnel 報表資料</div>
              </div>
              <div className="text-sm text-gray-600">
                手動上傳 / 每週一自動同步
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">目標設定</div>
                <div className="text-sm text-gray-500">年度/月度目標</div>
              </div>
              <div className="text-sm text-gray-600">
                後台手動編輯
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
