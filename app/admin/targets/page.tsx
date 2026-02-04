'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Target {
  id: string
  year: number
  month: number
  repId: string
  repName: string
  targetAmount: number
  actualAmount?: number
}

interface TeamMember {
  id: string
  name: string
  englishName?: string
}

export default function TargetsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [targets, setTargets] = useState<Target[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingTarget, setEditingTarget] = useState<Target | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [selectedYear])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // 載入目標
      const targetsRes = await fetch(`/api/targets?year=${selectedYear}`)
      const targetsData = await targetsRes.json()
      if (targetsData.success) {
        setTargets(targetsData.data)
      }

      // 載入業務團隊
      const teamRes = await fetch('/api/team')
      const teamData = await teamRes.json()
      if (teamData.success) {
        setTeam(teamData.data)
      }
    } catch (e) {
      console.error('Failed to load data:', e)
      setMessage({ type: 'error', text: '載入失敗' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (target: Target) => {
    setEditingTarget({ ...target })
    setIsNew(false)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingTarget({
      id: '',
      year: selectedYear,
      month: new Date().getMonth() + 1,
      repId: team[0]?.id || '',
      repName: team[0]?.name || '',
      targetAmount: 0,
    })
    setIsNew(true)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!editingTarget) return
    
    if (!editingTarget.repId || !editingTarget.targetAmount) {
      setMessage({ type: 'error', text: '請選擇業務員並輸入目標金額' })
      return
    }
    
    // 更新 repName
    const rep = team.find(t => t.id === editingTarget.repId)
    if (rep) {
      editingTarget.repName = rep.name
    }
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/targets', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTarget),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: '儲存成功' })
        setShowModal(false)
        setEditingTarget(null)
        loadData()
      } else {
        setMessage({ type: 'error', text: data.message || '儲存失敗' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: '儲存失敗' })
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // 按業務員分組
  const targetsByRep = team.map(member => {
    const memberTargets = targets.filter(t => t.repId === member.id)
    const totalTarget = memberTargets.reduce((sum, t) => sum + t.targetAmount, 0)
    return {
      ...member,
      targets: memberTargets,
      totalTarget,
    }
  })

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const years = [2024, 2025, 2026, 2027]

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">← 返回</Link>
            <h1 className="text-xl font-bold">🎯 目標設定</h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="p-2 border rounded-lg"
            >
              {years.map(y => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + 新增目標
            </button>
          </div>
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
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 sticky left-0 bg-gray-50">業務員</th>
                {months.map(m => (
                  <th key={m} className="px-4 py-3 text-center text-sm font-semibold text-gray-600 min-w-[80px]">
                    {m}月
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 bg-blue-50">年度總計</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {targetsByRep.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium sticky left-0 bg-white">
                    {member.name}
                    <span className="text-xs text-gray-500 ml-1">{member.englishName}</span>
                  </td>
                  {months.map(m => {
                    const target = member.targets.find(t => t.month === m)
                    return (
                      <td key={m} className="px-4 py-3 text-center">
                        {target ? (
                          <button
                            onClick={() => handleEdit(target)}
                            className="text-blue-600 hover:underline"
                          >
                            {(target.targetAmount / 1000).toFixed(0)}K
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingTarget({
                                id: '',
                                year: selectedYear,
                                month: m,
                                repId: member.id,
                                repName: member.name,
                                targetAmount: 0,
                              })
                              setIsNew(true)
                              setShowModal(true)
                            }}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            +
                          </button>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-center font-bold bg-blue-50">
                    {(member.totalTarget / 1000).toFixed(0)}K
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {team.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              請先新增業務員
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && editingTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">{isNew ? '新增目標' : '編輯目標'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">業務員</label>
                <select
                  value={editingTarget.repId}
                  onChange={(e) => setEditingTarget({ ...editingTarget, repId: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  disabled={!isNew}
                >
                  {team.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年</label>
                  <select
                    value={editingTarget.year}
                    onChange={(e) => setEditingTarget({ ...editingTarget, year: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                    disabled={!isNew}
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">月</label>
                  <select
                    value={editingTarget.month}
                    onChange={(e) => setEditingTarget({ ...editingTarget, month: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                    disabled={!isNew}
                  >
                    {months.map(m => (
                      <option key={m} value={m}>{m}月</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目標金額 (千元)</label>
                <input
                  type="number"
                  value={editingTarget.targetAmount / 1000}
                  onChange={(e) => setEditingTarget({ ...editingTarget, targetAmount: parseFloat(e.target.value) * 1000 || 0 })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="例如: 5000 (表示 5,000K)"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingTarget(null); }}
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
