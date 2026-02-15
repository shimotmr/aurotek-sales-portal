'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'

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

function getYouTubeThumbnail(url: string, customThumbnail?: string): string {
  if (customThumbnail) return customThumbnail
  const match = url?.match(/(?:v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
  return 'https://placehold.co/320x180/e9ecef/adb5bd?text=No+Image'
}

function getYouTubeEmbedUrl(url: string): string {
  const match = url?.match(/(?:v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`
  return url
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRobotType, setSelectedRobotType] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  useEffect(() => {
    fetch('/api/marketing/videos')
      .then(res => res.json())
      .then(data => {
        setVideos(data.videos || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load videos:', err)
        setLoading(false)
      })
  }, [])

  const categories = useMemo(() => 
    Array.from(new Set(videos.map(v => v.category))).filter(Boolean).sort(),
    [videos]
  )

  const robotTypes = useMemo(() => 
    Array.from(new Set(videos.map(v => v.robotType))).filter(Boolean).sort(),
    [videos]
  )

  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      const matchSearch = !searchQuery || 
        v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.keywords?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = !selectedCategory || v.category === selectedCategory
      const matchRobotType = !selectedRobotType || v.robotType === selectedRobotType
      return matchSearch && matchCategory && matchRobotType
    })
  }, [videos, searchQuery, selectedCategory, selectedRobotType])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
            <span className="text-lg bg-gradient-to-br from-violet-500 to-violet-600 bg-clip-text text-transparent">🎬</span>
            <h1 className="text-lg font-bold text-slate-800">影片案例</h1>
          </div>
          <a href="/marketing/slides" className="btn bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm">
            📑 簡報案例
          </a>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="search"
                placeholder="搜尋標題、客戶、關鍵字..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">所有類別</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              value={selectedRobotType}
              onChange={e => setSelectedRobotType(e.target.value)}
            >
              <option value="">所有機型</option>
              {robotTypes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            共 {filteredVideos.length} 筆影片
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredVideos.map(video => (
            <div 
              key={video.id}
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="relative pb-[56.25%] bg-gray-200">
                <img 
                  src={getYouTubeThumbnail(video.videoUrl, video.customThumbnail)}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/320x180/e9ecef/adb5bd?text=No+Image'
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {video.region}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate" title={video.title}>
                  {video.title}
                </h3>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {video.robotType}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded truncate">
                    {video.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2 truncate">
                  {video.client || '未標示客戶'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">📭</p>
            <p>沒有符合條件的影片</p>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="bg-gray-900 rounded-lg overflow-hidden w-full max-w-4xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold truncate">{selectedVideo.title}</h3>
              <button 
                className="text-gray-400 hover:text-white text-2xl"
                onClick={() => setSelectedVideo(null)}
              >
                ×
              </button>
            </div>
            <div className="relative pb-[56.25%]">
              <iframe
                src={getYouTubeEmbedUrl(selectedVideo.videoUrl)}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay"
              />
            </div>
            <div className="p-4 text-gray-300 text-sm">
              <p><strong>客戶：</strong>{selectedVideo.client || '未標示'}</p>
              <p><strong>機型：</strong>{selectedVideo.robotType}</p>
              <p><strong>關鍵字：</strong>{selectedVideo.keywords}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
