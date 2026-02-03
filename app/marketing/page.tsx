import Link from 'next/link'

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-white/80 hover:text-white text-sm">
            ← 返回首頁
          </Link>
          <h1 className="text-4xl font-bold text-white mt-4 mb-2">📚 數位資源庫</h1>
          <p className="text-white/80">影片案例、簡報資源、播放清單</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Videos */}
          <Link 
            href="/marketing/videos"
            className="block bg-white/10 backdrop-blur rounded-2xl p-8 text-white hover:bg-white/20 transition transform hover:scale-105"
          >
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2">影片案例</h2>
            <p className="text-white/80">
              產品演示、客戶案例、官方宣傳影片
            </p>
            <div className="mt-4 text-sm text-white/60">
              YouTube 影片 · 分類瀏覽 · 關鍵字搜尋
            </div>
          </Link>

          {/* Slides */}
          <Link 
            href="/marketing/slides"
            className="block bg-white/10 backdrop-blur rounded-2xl p-8 text-white hover:bg-white/20 transition transform hover:scale-105"
          >
            <div className="text-6xl mb-4">📑</div>
            <h2 className="text-2xl font-bold mb-2">簡報案例</h2>
            <p className="text-white/80">
              產品簡報、方案提案、技術文件
            </p>
            <div className="mt-4 text-sm text-white/60">
              Google Slides · 播放清單 · 依序播放
            </div>
          </Link>

          {/* Walker Docs */}
          <Link 
            href="/marketing/walker-docs"
            className="block bg-white/10 backdrop-blur rounded-2xl p-8 text-white hover:bg-white/20 transition transform hover:scale-105"
          >
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold mb-2">Walker 天工文檔</h2>
            <p className="text-white/80">
              Walker 機器人技術文檔、SDK、用戶手冊
            </p>
            <div className="mt-4 text-sm text-white/60">
              UBTECH · 用戶手冊 · SDK 文檔
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 text-center text-white/60 text-sm">
          <p>📱 支援手機瀏覽 · 🔍 關鍵字搜尋 · 📋 播放清單功能</p>
        </div>
      </div>
    </main>
  )
}
