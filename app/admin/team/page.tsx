'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TeamMember {
  id: string
  name: string
  englishName?: string
  email: string
  phone: string
  region: string
  status: 'active' | 'inactive'
  ytdShipped?: number
  ytdTarget?: number
}

export default function TeamPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [team, setTeam] = useState<TeamMember[]>([])
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 載入資料
  useEffect(() => {
    loadTeam()
  }, [])

  const loadTeam = async () => {
    try {
      const res = await fetch('/api/team')
      const data = await res.json()
      if (data.success) {
        setTeam(data.data)
      }
    } catch (e) {
      console.error('Failed to load team:', e)
      setMessage({ type: 'error', text: '載入失敗' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember({ ...member })
    setIsNew(false)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingMember({
      id: '',
      name: '',
      englishName: '',
      email: '',
      phone: '',
      region: '全區',
      status: 'active',
    })
    setIsNew(true)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!editingMember) return
    
    if (!editingMember.id || !editingMember.name) {
      setMessage({ type: 'error', text: '工號和姓名為必填' })
      return
    }
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/team', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: isNew ? '新增成功' : '更新成功' })
        setShowModal(false)
        setEditingMember(null)
        loadTeam() // 重新載入
      } else {
        setMessage({ type: 'error', text: data.message || '儲存失敗' })
      }
    } catch (e) {
      console.error('Failed to save:', e)
      setMessage({ type: 'error', text: '儲存失敗' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此業務員？')) return
    
    try {
      const res = await fetch(`/api/team?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: '刪除成功' })
        loadTeam()
      } else {
        setMessage({ type: 'error', text: data.message || '刪除失敗' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: '刪除失敗' })
    }
  }

  const getAchievementRate = (shipped: number = 0, target: number = 0) => {
    if (target === 0) return 0
    return Math.round((shipped / target) * 100)
  }

  // 清除訊息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-slate-700 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </Link>
            <span className="text-lg bg-gradient-to-br from-gray-600 to-gray-800 bg-clip-text text-transparent">👥</span>
            <h1 className="text-lg font-bold text-slate-800">業務團隊</h1>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + 新增業務員
          </button>
        </div>
      </header>

      {/* 訊息提示 */}
      {message && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map(member => (
            <div key={member.id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{member.name} {member.englishName}</h3>
                  <p className="text-sm text-gray-500">{member.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {member.status === 'active' ? '在職' : '離職'}
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
                  <span>{(member.ytdShipped || 0).toLocaleString()}K</span>
                  <span>{(member.ytdTarget || 0).toLocaleString()}K</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  ✏️ 編輯
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="px-3 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {team.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            尚無業務員資料，請點擊「新增業務員」
          </div>
        )}
      </main>

      {/* 編輯/新增 Modal */}
      {showModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{isNew ? '新增業務員' : '編輯業務員'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工號 *</label>
                <input
                  type="text"
                  value={editingMember.id}
                  onChange={(e) => setEditingMember({ ...editingMember, id: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="例如: u1234"
                  disabled={!isNew}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">英文名</label>
                <input
                  type="text"
                  value={editingMember.englishName || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, englishName: e.target.value })}
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
                <select
                  value={editingMember.region}
                  onChange={(e) => setEditingMember({ ...editingMember, region: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="全區">全區</option>
                  <option value="北區">北區</option>
                  <option value="中區">中區</option>
                  <option value="南區">南區</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <select
                  value={editingMember.status}
                  onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="active">在職</option>
                  <option value="inactive">離職</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingMember(null); }}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                disabled={isSaving}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
