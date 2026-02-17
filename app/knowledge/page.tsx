'use client'

import { useState, useEffect, useCallback } from 'react'

// 知識條目類型定義
interface KnowledgeItem {
  id: number
  title: string
  summary: string
  content: string
  category: string
  tags: string[]
  created_date: string
  updated_date: string
  views: number
}

// 知識分類
const CATEGORIES = ['全部', '產品知識', '銷售技巧', '常見問題']

// 骨架屏組件
function KnowledgeCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border rounded-xl p-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-12" />
          </div>
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="space-y-1 mb-3">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <div className="h-5 bg-gray-200 rounded w-12" />
              <div className="h-5 bg-gray-200 rounded w-16" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </>
  )
}

// 詳細頁面組件
function KnowledgeDetail({ item, onClose }: { item: KnowledgeItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 transition-opacity" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-full sm:w-[600px] max-w-full bg-white flex flex-col shadow-2xl transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span>←</span>
            <span>返回知識庫</span>
          </button>
          <div className="font-bold text-sm text-gray-500">知識詳情</div>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-auto flex-1">
          {/* 分類標籤 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
              {item.category}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(item.created_date).toLocaleDateString('zh-TW')}
            </span>
            <span className="text-xs text-gray-500">
              {item.views} 次瀏覽
            </span>
          </div>
          
          {/* 標題 */}
          <h1 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
            {item.title}
          </h1>
          
          {/* 摘要 */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">摘要</div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {item.summary}
            </p>
          </div>
          
          {/* 標籤 */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">相關標籤</div>
            <div className="flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* 內容 */}
          <div className="prose prose-sm max-w-none">
            <div className="text-sm font-medium text-gray-700 mb-2">詳細內容</div>
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {item.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function KnowledgePage() {
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeItem[]>([])
  const [filteredData, setFilteredData] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  // 載入知識庫資料
  useEffect(() => {
    const loadKnowledgeData = async () => {
      try {
        // 模擬 API 載入 (目前使用靜態資料)
        const response = await fetch('/data/knowledge.json')
        const data = await response.json()
        setKnowledgeData(data)
      } catch (error) {
        console.error('Error loading knowledge data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadKnowledgeData()
  }, [])

  // 篩選邏輯
  const filterData = useCallback(() => {
    let filtered = knowledgeData

    // 分類篩選
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // 搜尋篩選
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.summary.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        item.content.toLowerCase().includes(searchTerm)
      )
    }

    // 依建立日期排序 (最新的在前)
    filtered.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.updated_date).getTime())

    setFilteredData(filtered)
  }, [knowledgeData, selectedCategory, search])

  useEffect(() => {
    filterData()
  }, [filterData])

  // 開啟詳細頁面
  const openDetail = (item: KnowledgeItem) => {
    setSelectedItem(item)
    setDrawerOpen(true)
  }

  // 關閉詳細頁面
  const closeDetail = () => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedItem(null), 300)
  }

  // 清除篩選條件
  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('全部')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Page Header */}
      <header className={`bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-20 ${drawerOpen ? 'hidden sm:block' : ''}`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-sm sm:text-base">知識庫</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {/* 頁面標題 */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            知識庫 📚
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            產品知識、銷售技巧、常見問題，助力業務成功
          </p>
        </div>

        {/* 搜尋和篩選區 */}
        <div className="mb-6 space-y-4">
          {/* 搜尋框 */}
          <div className="flex gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋標題、摘要、標籤..."
              className="flex-1 p-3 text-sm bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 outline-none transition-all"
            />
            {(search || selectedCategory !== '全部') && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                清除
              </button>
            )}
          </div>

          {/* 分類篩選 */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {category}
                {category !== '全部' && (
                  <span className="ml-1 text-xs opacity-75">
                    ({knowledgeData.filter(item => item.category === category).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 結果統計 */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-gray-600 text-sm">
            {loading ? '載入中...' : `共 ${filteredData.length} 筆知識`}
          </span>
        </div>

        {/* 知識條目列表 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <KnowledgeCardSkeleton count={9} />
          ) : filteredData.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">
              <div className="text-4xl mb-2">🔍</div>
              <div className="font-medium mb-1">找不到相關知識</div>
              <div className="text-sm">試試調整搜尋條件或瀏覽其他分類</div>
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.id}
                onClick={() => openDetail(item)}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
              >
                {/* 分類和日期 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.created_date).toLocaleDateString('zh-TW', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* 標題 */}
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {item.title}
                </h3>

                {/* 摘要 */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>

                {/* 底部資訊 */}
                <div className="flex items-center justify-between">
                  {/* 標籤 */}
                  <div className="flex gap-1 overflow-hidden">
                    {item.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-xs text-gray-400">+{item.tags.length - 2}</span>
                    )}
                  </div>

                  {/* 瀏覽次數 */}
                  <span className="text-xs text-gray-400">
                    {item.views} 次瀏覽
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 詳細頁面 */}
      {drawerOpen && selectedItem && (
        <KnowledgeDetail item={selectedItem} onClose={closeDetail} />
      )}
    </div>
  )
}