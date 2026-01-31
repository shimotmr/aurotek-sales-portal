export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          和椿通路營業管理系統
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
