'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Video {
  id: string
  title: string
  category: string
  subCategory: string
  region: string
  robotType: string
  client: string
  videoUrl: string
  keywords: string
  customThumbnail?: string
}

export default function VideosAdminPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [videos, setVideos] = useState<Video[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // 認證由 middleware 處理，直接載入資料
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/marketing/videos')
      const data = await res.json()
      setVideos(data.videos || [])
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    }
    setIsLoading(false)
  }

  const filteredVideos = videos.filter(v =>
    v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.client?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (video: Video) => {
    setEditingVideo({ ...video })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingVideo({
      id: '',
      title: '',
      category: '',
      subCategory: '',
      region: '',
      robotType: '',
      client: '',
      videoUrl: '',
      keywords: '',
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
            <span className="text-lg bg-gradient-to-br from-gray-600 to-gray-800 bg-clip-text text-transparent">🎬</span>
            <h1 className="text-lg font-bold text-slate-800">影片管理</h1>
          </div>
          <button
            onClick={handleAdd}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            + 新增影片
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜尋 */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <input
            type="text"
            placeholder="🔍 搜尋影片標題、分類、客戶..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* 統計 */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <span className="text-gray-600">共 <span className="font-bold text-red-600">{filteredVideos.length}</span> 部影片</span>
        </div>

        {/* 影片列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold">標題</th>
                <th className="text-left p-4 text-sm font-semibold hidden md:table-cell">分類</th>
                <th className="text-left p-4 text-sm font-semibold hidden md:table-cell">客戶</th>
                <th className="text-left p-4 text-sm font-semibold hidden lg:table-cell">機型</th>
                <th className="text-center p-4 text-sm font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.map(video => (
                <tr key={video.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold truncate max-w-[200px]">{video.title}</div>
                    <div className="text-xs text-gray-500 md:hidden">{video.category} • {video.client}</div>
                  </td>
                  <td className="p-4 text-sm hidden md:table-cell">{video.category}</td>
                  <td className="p-4 text-sm hidden md:table-cell">{video.client || '-'}</td>
                  <td className="p-4 text-sm hidden lg:table-cell">{video.robotType || '-'}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(video)}
                      className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                    >
                      編輯
                    </button>
                    <a
                      href={video.videoUrl}
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
          💡 影片資料來源：Google Sheets，如需修改請前往 
          <a href="https://script.google.com/macros/s/AKfycbzaz_TGNZvwL5W_s7WfdnGxdzSPkOAiQuoQINnzTq0-FJ5OlMgF87GUt1OkeH-WbE1H/exec" 
             target="_blank" 
             className="text-blue-600 hover:underline ml-1">
            數位資源庫管理系統
          </a>
        </p>
      </main>

      {/* 編輯 Modal */}
      {showModal && editingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingVideo.id ? '編輯影片' : '新增影片'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                <input
                  type="text"
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">影片網址</label>
                <input
                  type="text"
                  value={editingVideo.videoUrl}
                  onChange={(e) => setEditingVideo({ ...editingVideo, videoUrl: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="YouTube 或 Google Drive 連結"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                  <input
                    type="text"
                    value={editingVideo.category}
                    onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">子分類</label>
                  <input
                    type="text"
                    value={editingVideo.subCategory}
                    onChange={(e) => setEditingVideo({ ...editingVideo, subCategory: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客戶</label>
                  <input
                    type="text"
                    value={editingVideo.client}
                    onChange={(e) => setEditingVideo({ ...editingVideo, client: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">機型</label>
                  <input
                    type="text"
                    value={editingVideo.robotType}
                    onChange={(e) => setEditingVideo({ ...editingVideo, robotType: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">關鍵字</label>
                <input
                  type="text"
                  value={editingVideo.keywords}
                  onChange={(e) => setEditingVideo({ ...editingVideo, keywords: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="以分號分隔"
                />
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
