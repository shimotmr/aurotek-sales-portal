'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Dealer {
  id: string
  name: string
  region: string
  contactName: string
  contactPhone: string
  contactEmail: string
  status: 'active' | 'inactive'
  ytdShipped: number
  caseCount: number
}

export default function DealersPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dealers, setDealers] = useState<Dealer[]>([
    { id: 'D001', name: '阜爾運通', region: '北區', contactName: '', contactPhone: '', contactEmail: '', status: 'active', ytdShipped: 4958, caseCount: 5 },
    { id: 'D002', name: '禾煜科技', region: '北區', contactName: '', contactPhone: '', contactEmail: '', status: 'active', ytdShipped: 1146, caseCount: 6 },
    { id: 'D003', name: '智領未來', region: '中區', contactName: '', contactPhone: '', contactEmail: '', status: 'active', ytdShipped: 869, caseCount: 10 },
    { id: 'D004', name: '禾達工業', region: '北區', contactName: '', contactPhone: '', contactEmail: '', status: 'active', ytdShipped: 801, caseCount: 5 },
    { id: 'D005', name: '季河資訊', region: '北區', contactName: '', contactPhone: '', contactEmail: '', status: 'active', ytdShipped: 328, caseCount: 4 },
    { id: 'D006', name: '鋥承', region: '中區', contactName: '', contactPhone: '', contactEmail: '', status: 'active', ytdShipped: 238, caseCount: 3 },
    { id: 'D007', name: '鴻匠', region: '南區', contactName: '', contactPhone: '', contactEmail: '', status: 'active', ytdShipped: 235, caseCount: 3 },
    { id: 'D008', name: '傑融科技', region: '北區', contactName: '', contactPhone: '', contactEmail: '', status: 'active', ytdShipped: 160, caseCount: 8 },
    { id: 'D009', name: '谷得智能', region: '中區', contactName: '', contactPhone: '', contactEmail: '', status: 'active', ytdShipped: 119, caseCount: 3 },
    { id: 'D010', name: '瑞興', region: '南區', contactName: '', contactPhone: '', contactEmail: '', status: 'active', ytdShipped: 9, caseCount: 4 },
  ])
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth')
    if (auth !== 'true') {
      router.push('/admin')
      return
    }
    setIsLoading(false)
  }, [router])

  const filteredDealers = dealers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.region.includes(searchQuery)
  )

  const handleEdit = (dealer: Dealer) => {
    setEditingDealer({ ...dealer })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!editingDealer) return
    setDealers(prev => prev.map(d => d.id === editingDealer.id ? editingDealer : d))
    setShowModal(false)
    setEditingDealer(null)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">← 返回</Link>
            <h1 className="text-xl font-bold">🏢 經銷商管理</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜尋 */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <input
            type="text"
            placeholder="🔍 搜尋經銷商名稱或區域..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-purple-600">{dealers.length}</div>
            <div className="text-sm text-gray-600">經銷商數</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">{dealers.reduce((a, b) => a + b.ytdShipped, 0).toLocaleString()}K</div>
            <div className="text-sm text-gray-600">總出貨</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">{dealers.reduce((a, b) => a + b.caseCount, 0)}</div>
            <div className="text-sm text-gray-600">總案件數</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-orange-600">{dealers.filter(d => d.status === 'active').length}</div>
            <div className="text-sm text-gray-600">活躍經銷商</div>
          </div>
        </div>

        {/* 經銷商列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold">經銷商</th>
                <th className="text-left p-4 text-sm font-semibold">區域</th>
                <th className="text-right p-4 text-sm font-semibold">案件數</th>
                <th className="text-right p-4 text-sm font-semibold">出貨(K)</th>
                <th className="text-center p-4 text-sm font-semibold">狀態</th>
                <th className="text-center p-4 text-sm font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDealers.map(dealer => (
                <tr key={dealer.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold">{dealer.name}</div>
                    <div className="text-xs text-gray-500">{dealer.id}</div>
                  </td>
                  <td className="p-4 text-sm">{dealer.region}</td>
                  <td className="p-4 text-right text-sm">{dealer.caseCount}</td>
                  <td className="p-4 text-right font-semibold text-green-600">{dealer.ytdShipped.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      dealer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {dealer.status === 'active' ? '活躍' : '停用'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(dealer)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      編輯
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* 編輯 Modal */}
      {showModal && editingDealer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">編輯經銷商</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名稱</label>
                <input
                  type="text"
                  value={editingDealer.name}
                  onChange={(e) => setEditingDealer({ ...editingDealer, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">區域</label>
                <select
                  value={editingDealer.region}
                  onChange={(e) => setEditingDealer({ ...editingDealer, region: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="北區">北區</option>
                  <option value="中區">中區</option>
                  <option value="南區">南區</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">聯絡人</label>
                <input
                  type="text"
                  value={editingDealer.contactName}
                  onChange={(e) => setEditingDealer({ ...editingDealer, contactName: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                <input
                  type="text"
                  value={editingDealer.contactPhone}
                  onChange={(e) => setEditingDealer({ ...editingDealer, contactPhone: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingDealer.contactEmail}
                  onChange={(e) => setEditingDealer({ ...editingDealer, contactEmail: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <select
                  value={editingDealer.status}
                  onChange={(e) => setEditingDealer({ ...editingDealer, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="active">活躍</option>
                  <option value="inactive">停用</option>
                </select>
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
                onClick={handleSave}
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
