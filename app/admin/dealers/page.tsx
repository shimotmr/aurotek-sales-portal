'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Dealer {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  region: string
  status: 'active' | 'inactive'
  address?: string
  notes?: string
}

export default function DealersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadDealers()
  }, [])

  const loadDealers = async () => {
    try {
      const res = await fetch('/api/dealers')
      const data = await res.json()
      if (data.success) {
        setDealers(data.data)
      }
    } catch (e) {
      console.error('Failed to load dealers:', e)
      setMessage({ type: 'error', text: '載入失敗' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (dealer: Dealer) => {
    setEditingDealer({ ...dealer })
    setIsNew(false)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingDealer({
      id: '',
      name: '',
      contact: '',
      phone: '',
      email: '',
      region: '北區',
      status: 'active',
      address: '',
      notes: '',
    })
    setIsNew(true)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!editingDealer) return
    
    if (!editingDealer.name) {
      setMessage({ type: 'error', text: '經銷商名稱為必填' })
      return
    }
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/dealers', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDealer),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: isNew ? '新增成功' : '更新成功' })
        setShowModal(false)
        setEditingDealer(null)
        loadDealers()
      } else {
        setMessage({ type: 'error', text: data.message || '儲存失敗' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: '儲存失敗' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此經銷商？')) return
    
    try {
      const res = await fetch(`/api/dealers?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: '刪除成功' })
        loadDealers()
      } else {
        setMessage({ type: 'error', text: data.message || '刪除失敗' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: '刪除失敗' })
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const filteredDealers = dealers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.region.includes(searchTerm)
  )

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-slate-700 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </Link>
            <span className="text-lg bg-gradient-to-br from-gray-600 to-gray-800 bg-clip-text text-transparent">🏢</span>
            <h1 className="text-lg font-bold text-slate-800">經銷商管理</h1>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + 新增經銷商
          </button>
        </div>
      </header>

      {message && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜尋 */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="搜尋經銷商名稱、聯絡人、區域..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 p-3 border rounded-lg"
          />
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">經銷商</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">聯絡人</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">電話</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">區域</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">狀態</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDealers.map(dealer => (
                <tr key={dealer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{dealer.name}</div>
                    <div className="text-xs text-gray-500">{dealer.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{dealer.contact || '-'}</td>
                  <td className="px-4 py-3 text-sm">{dealer.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm">{dealer.region}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      dealer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {dealer.status === 'active' ? '合作中' : '停止合作'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(dealer)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(dealer.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredDealers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? '找不到符合的經銷商' : '尚無經銷商資料'}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && editingDealer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{isNew ? '新增經銷商' : '編輯經銷商'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">經銷商名稱 *</label>
                <input
                  type="text"
                  value={editingDealer.name}
                  onChange={(e) => setEditingDealer({ ...editingDealer, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">聯絡人</label>
                  <input
                    type="text"
                    value={editingDealer.contact}
                    onChange={(e) => setEditingDealer({ ...editingDealer, contact: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                  <input
                    type="text"
                    value={editingDealer.phone}
                    onChange={(e) => setEditingDealer({ ...editingDealer, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingDealer.email}
                  onChange={(e) => setEditingDealer({ ...editingDealer, email: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    <option value="東區">東區</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                  <select
                    value={editingDealer.status}
                    onChange={(e) => setEditingDealer({ ...editingDealer, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="active">合作中</option>
                    <option value="inactive">停止合作</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                <input
                  type="text"
                  value={editingDealer.address || ''}
                  onChange={(e) => setEditingDealer({ ...editingDealer, address: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                <textarea
                  value={editingDealer.notes || ''}
                  onChange={(e) => setEditingDealer({ ...editingDealer, notes: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingDealer(null); }}
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
