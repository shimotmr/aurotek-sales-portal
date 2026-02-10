import Link from 'next/link'
import UserMenu from './components/UserMenu'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            和椿通路營業管理系統
          </h1>
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="text-gray-400 hover:text-gray-600 transition"
              title="後台管理"
            >
              ⚙️
            </Link>
            <UserMenu />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 業績管理 */}
          <a href="/performance" className="block p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow hover:shadow-lg transition text-white">
            <div className="text-4xl mb-4">📈</div>
            <h2 className="text-xl font-semibold mb-2">業績管理</h2>
            <p className="text-blue-100">Pipeline 分析 / 目標達成率</p>
          </a>
          
          {/* 數位資源庫 */}
          <a href="/marketing" className="block p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow hover:shadow-lg transition text-white">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-xl font-semibold mb-2">數位資源庫</h2>
            <p className="text-purple-100">影片案例 / 簡報資源 / 播放清單</p>
          </a>
          
          {/* 樣品借用 */}
          <a href="/samples" className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">樣品借用管理</h2>
            <p className="text-gray-600">追蹤樣品借出、歸還狀態</p>
          </a>
          
          {/* 產品查詢 */}
          <a href="/products" className="block p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow hover:shadow-lg transition text-white">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">產品查詢</h2>
            <p className="text-green-100">搜尋產品 / 價格資訊</p>
          </a>

          {/* 報價單 */}
          <a href="/quotations/new" className="block p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow hover:shadow-lg transition text-white">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-semibold mb-2">報價單製作</h2>
            <p className="text-orange-100">快速產生報價單</p>
          </a>

          {/* 逐字稿 */}
          <a href="/transcripts" className="block p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow hover:shadow-lg transition text-white">
            <div className="text-4xl mb-4">🎤</div>
            <h2 className="text-xl font-semibold mb-2">會議逐字稿</h2>
            <p className="text-indigo-100">語音轉文字 / 智慧校正</p>
          </a>
          
          {/* 庫存查詢 */}
          <a href="/inventory" className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">庫存查詢</h2>
            <p className="text-gray-600">即時庫存狀態</p>
          </a>

          {/* 後台管理 */}
          <a href="/admin" className="block p-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg shadow hover:shadow-lg transition text-white">
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="text-xl font-semibold mb-2">後台管理</h2>
            <p className="text-gray-300">目標設定 / 團隊管理 / 經銷商</p>
          </a>
        </div>
      </div>
    </main>
  )
}
