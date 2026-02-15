'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Slide {
  id: string
  title: string
  category: string
  subCategory: string
  region: string
  client: string
  slideUrl: string
  keywords: string
  permittedAdmins?: string
  customThumbnail?: string
}

export default function SlidesAdminPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [slides, setSlides] = useState<Slide[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // 認證由 middleware 處理，直接載入資料
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      const res = await fetch('/api/marketing/slides')
      const data = await res.json()
      setSlides(data.slides || [])
    } catch (err) {
      console.error('Failed to fetch slides:', err)
    }
    setIsLoading(false)
  }

  const filteredSlides = slides.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.client?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (slide: Slide) => {
    setEditingSlide({ ...slide })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingSlide({
      id: '',
      title: '',
      category: '',
      subCategory: '',
      region: '',
      client: '',
      slideUrl: '',
      keywords: '',
      permittedAdmins: '',
      customThumbnail: ''
    })
    setShowModal(true)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-slate-700 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </Link>
            <span className="text-lg bg-gradient-to-br from-gray-600 to-gray-800 bg-clip-text text-transparent">📑</span>
            <h1 className="text-lg font-bold text-slate-800">簡報管理</h1>
          </div>
          <button
            onClick={handleAdd}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
          >
            + 新增簡報
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜尋 */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <input
            type="text"
            placeholder="🔍 搜尋簡報標題、分類、客戶..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* 統計 */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex gap-6">
          <span className="text-gray-600">共 <span className="font-bold text-yellow-600">{filteredSlides.length}</span> 份簡報</span>
          <span className="text-gray-600">公開 <span className="font-bold text-green-600">{slides.filter(s => !s.permittedAdmins).length}</span></span>
          <span className="text-gray-600">受限 <span className="font-bold text-red-600">{slides.filter(s => s.permittedAdmins).length}</span></span>
        </div>

        {/* 簡報列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold">標題</th>
                <th className="text-left p-4 text-sm font-semibold hidden md:table-cell">分類</th>
                <th className="text-center p-4 text-sm font-semibold hidden md:table-cell">權限</th>
                <th className="text-center p-4 text-sm font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlides.map(slide => (
                <tr key={slide.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold truncate max-w-[250px]">{slide.title}</div>
                    <div className="text-xs text-gray-500 md:hidden">
                      {slide.category} • {slide.permittedAdmins ? '🔒 受限' : '🌐 公開'}
                    </div>
                  </td>
                  <td className="p-4 text-sm hidden md:table-cell">{slide.category || '-'}</td>
                  <td className="p-4 text-center hidden md:table-cell">
                    {slide.permittedAdmins ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">🔒 受限</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">🌐 公開</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(slide)}
                      className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                    >
                      編輯
                    </button>
                    <a
                      href={slide.slideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      預覽
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-gray-500 mt-4 text-center">
          💡 簡報資料來源：Google Sheets，如需修改請前往 
          <a href="https://script.google.com/macros/s/AKfycbzaz_TGNZvwL5W_s7WfdnGxdzSPkOAiQuoQINnzTq0-FJ5OlMgF87GUt1OkeH-WbE1H/exec" 
             target="_blank" 
             className="text-blue-600 hover:underline ml-1">
            數位資源庫管理系統
          </a>
        </p>
      </main>

      {/* 編輯 Modal */}
      {showModal && editingSlide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingSlide.id ? '編輯簡報' : '新增簡報'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                <input
                  type="text"
                  value={editingSlide.title}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">簡報網址</label>
                <input
                  type="text"
                  value={editingSlide.slideUrl}
                  onChange={(e) => setEditingSlide({ ...editingSlide, slideUrl: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Google Slides 連結"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                  <input
                    type="text"
                    value={editingSlide.category}
                    onChange={(e) => setEditingSlide({ ...editingSlide, category: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">子分類</label>
                  <input
                    type="text"
                    value={editingSlide.subCategory}
                    onChange={(e) => setEditingSlide({ ...editingSlide, subCategory: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">關鍵字</label>
                <input
                  type="text"
                  value={editingSlide.keywords}
                  onChange={(e) => setEditingSlide({ ...editingSlide, keywords: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="以分號分隔"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">權限設定</label>
                <input
                  type="text"
                  value={editingSlide.permittedAdmins || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, permittedAdmins: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="留空為公開，填入帳號以逗號分隔"
                />
                <p className="text-xs text-gray-500 mt-1">例：admin,william,robot</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  alert('儲存功能需連接 Google Sheets API，目前請至數位資源庫管理系統編輯')
                  setShowModal(false)
                }}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
