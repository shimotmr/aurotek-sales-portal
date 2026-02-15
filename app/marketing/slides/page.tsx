'use client'

import { ClipboardList, Film } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'

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

function getSlideThumbnail(url: string, customThumbnail?: string): string {
  if (customThumbnail) return customThumbnail
  const match = url?.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`
  return 'https://placehold.co/320x180/e9ecef/adb5bd?text=No+Image'
}

function getSlideEmbedUrl(url: string): string {
  const match = url?.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`
  return url
}

export default function SlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null)
  const [playlist, setPlaylist] = useState<Slide[]>([])
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [playingIndex, setPlayingIndex] = useState(-1)

  useEffect(() => {
    fetch('/api/marketing/slides')
      .then(res => res.json())
      .then(data => {
        setSlides(data.slides || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load slides:', err)
        setLoading(false)
      })
  }, [])

  const categories = useMemo(() => 
    Array.from(new Set(slides.map(s => s.category))).filter(Boolean).sort(),
    [slides]
  )

  const filteredSlides = useMemo(() => {
    return slides.filter(s => {
      // 已移除權限過濾，顯示所有簡報
      const matchSearch = !searchQuery || 
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keywords?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = !selectedCategory || s.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [slides, searchQuery, selectedCategory])

  const togglePlaylist = (slide: Slide) => {
    const exists = playlist.find(s => s.id === slide.id)
    if (exists) {
      setPlaylist(playlist.filter(s => s.id !== slide.id))
    } else {
      setPlaylist([...playlist, slide])
    }
  }

  const isInPlaylist = (slide: Slide) => playlist.some(s => s.id === slide.id)

  const startPlaylist = () => {
    if (playlist.length > 0) {
      setPlayingIndex(0)
      setShowPlaylist(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/marketing" className="text-slate-400 hover:text-slate-700 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </Link>
            <span className="text-lg bg-gradient-to-br from-violet-500 to-violet-600 bg-clip-text text-transparent">📑</span>
            <h1 className="text-lg font-bold text-slate-800">簡報案例</h1>
          </div>
          <div className="flex gap-2">
            <a href="/marketing/videos" className="bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 text-sm">
              <Film size={16} className="inline" /> 影片案例
            </a>
            {playlist.length > 0 && (
              <button 
                onClick={() => setShowPlaylist(true)}
                className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 relative text-sm"
              >
                <ClipboardList size={16} className="inline" /> 播放清單
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {playlist.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="search"
                placeholder="搜尋標題、客戶、關鍵字..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">所有類別</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            共 {filteredSlides.length} 份簡報（已過濾受限內容）
          </div>
        </div>

        {/* Slides Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSlides.map(slide => (
            <div 
              key={slide.id}
              className={`bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1 ${isInPlaylist(slide) ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div 
                className="relative pb-[56.25%] bg-gray-200"
                onClick={() => setSelectedSlide(slide)}
              >
                <img 
                  src={getSlideThumbnail(slide.slideUrl, slide.customThumbnail)}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/320x180/ff9500/ffffff?text=PPT'
                  }}
                />
                {/* 選擇按鈕 */}
                <div 
                  className="absolute top-2 left-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlaylist(slide)
                  }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow ${isInPlaylist(slide) ? 'bg-blue-500 text-white' : 'bg-white text-gray-400'}`}>
                    {isInPlaylist(slide) ? '✓' : '+'}
                  </div>
                </div>
              </div>
              <div className="p-4" onClick={() => setSelectedSlide(slide)}>
                <h3 className="font-semibold text-gray-900 truncate" title={slide.title}>
                  {slide.title}
                </h3>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded truncate">
                    {slide.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2 truncate">
                  {slide.client || '未標示客戶'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredSlides.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">📭</p>
            <p>沒有符合條件的簡報</p>
          </div>
        )}
      </div>

      {/* Slide Player Modal */}
      {selectedSlide && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSlide(null)}
        >
          <div 
            className="bg-gray-900 rounded-lg overflow-hidden w-full max-w-5xl h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold truncate">{selectedSlide.title}</h3>
              <button 
                className="text-gray-400 hover:text-white text-2xl"
                onClick={() => setSelectedSlide(null)}
              >
                ×
              </button>
            </div>
            <div className="flex-1">
              <iframe
                src={getSlideEmbedUrl(selectedSlide.slideUrl)}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Playlist Modal */}
      {showPlaylist && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPlaylist(false)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold flex items-center gap-2"><ClipboardList size={20} /> 播放清單</h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {playlist.map((slide, idx) => (
                <div key={slide.id} className="flex items-center gap-3 py-2 border-b">
                  <span className="text-gray-400">{idx + 1}</span>
                  <span className="flex-1 truncate">{slide.title}</span>
                  <button 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => setPlaylist(playlist.filter(s => s.id !== slide.id))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2">
              <button 
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                onClick={() => setPlaylist([])}
              >
                清空
              </button>
              <button 
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                onClick={startPlaylist}
              >
                ▶ 依序播放
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Playlist Player */}
      {playingIndex >= 0 && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <iframe
            src={getSlideEmbedUrl(playlist[playingIndex].slideUrl)}
            className="flex-1"
            allowFullScreen
          />
          <div className="bg-gray-900 p-4 flex justify-between items-center">
            <span className="text-white">
              {playingIndex + 1} / {playlist.length}: {playlist[playingIndex].title}
            </span>
            <div className="flex gap-2">
              <button 
                className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={playingIndex === 0}
                onClick={() => setPlayingIndex(playingIndex - 1)}
              >
                ← 上一個
              </button>
              <button 
                className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={playingIndex >= playlist.length - 1}
                onClick={() => setPlayingIndex(playingIndex + 1)}
              >
                下一個 →
              </button>
              <button 
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => setPlayingIndex(-1)}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
