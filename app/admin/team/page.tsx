'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  region: string
  status: 'active' | 'inactive'
  ytdShipped: number
  ytdTarget: number
}

export default function TeamPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [team, setTeam] = useState<TeamMember[]>([
    { id: 'u2625', name: '喬紹恆', email: 'shaohen@aurotek.com', phone: '0912-345-678', region: '北區', status: 'active', ytdShipped: 8865, ytdTarget: 52650 },
    { id: 'TBH-1', name: '待補-1', email: '', phone: '', region: '中區', status: 'inactive', ytdShipped: 0, ytdTarget: 48700 },
    { id: 'TBH-2', name: '待補-2', email: '', phone: '', region: '南區', status: 'inactive', ytdShipped: 0, ytdTarget: 48300 },
  ])
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // 認證由 middleware 處理，直接載入
    setIsLoading(false)
  }, [])

  const handleEdit = (member: TeamMember) => {
    setEditingMember({ ...member })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!editingMember) return
    setTeam(prev => prev.map(m => m.id === editingMember.id ? editingMember : m))
    setShowModal(false)
    setEditingMember(null)
  }

  const getAchievementRate = (shipped: number, target: number) => {
    if (target === 0) return 0
    return Math.round((shipped / target) * 100)
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
            <h1 className="text-xl font-bold">👥 業務團隊</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 團隊卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map(member => (
            <div key={member.id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {member.status === 'active' ? '在職' : '待補'}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm"><span className="text-gray-500">區域：</span>{member.region || '-'}</p>
                <p className="text-sm"><span className="text-gray-500">Email：</span>{member.email || '-'}</p>
                <p className="text-sm"><span className="text-gray-500">電話：</span>{member.phone || '-'}</p>
              </div>

              {/* 績效 */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>YTD 達成率</span>
                  <span className="font-bold">{getAchievementRate(member.ytdShipped, member.ytdTarget)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(getAchievementRate(member.ytdShipped, member.ytdTarget), 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{member.ytdShipped.toLocaleString()}K</span>
                  <span>{member.ytdTarget.toLocaleString()}K</span>
                </div>
              </div>

              <button
                onClick={() => handleEdit(member)}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                ✏️ 編輯
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* 編輯 Modal */}
      {showModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">編輯業務員</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                <input
                  type="text"
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">區域</label>
                <input
                  type="text"
                  value={editingMember.region}
                  onChange={(e) => setEditingMember({ ...editingMember, region: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <select
                  value={editingMember.status}
                  onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="active">在職</option>
                  <option value="inactive">待補</option>
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
