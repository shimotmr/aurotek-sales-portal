export default function Home() {
  // 數位資源庫（已整合到 Portal）
  
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          和椿通路營業管理系統
        </h1>
        
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
          
          {/* 報價單 */}
          <a href="/quotes" className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-semibold mb-2">報價單製作</h2>
            <p className="text-gray-600">快速產生報價單</p>
          </a>
          
          {/* 庫存查詢 */}
          <a href="/inventory" className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">庫存查詢</h2>
            <p className="text-gray-600">即時庫存狀態</p>
          </a>
        </div>
      </div>
    </main>
  )
}
