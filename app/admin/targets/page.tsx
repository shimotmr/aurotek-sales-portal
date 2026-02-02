'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TeamMember {
  id: string
  name: string
  targets: number[]
  annual: number
}

export default function TargetsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [team, setTeam] = useState<TeamMember[]>([
    { id: 'u2625', name: '喬紹恆', targets: [3400, 2700, 3500, 4000, 3550, 3600, 4500, 4400, 5100, 5000, 6100, 6800], annual: 52650 },
    { id: 'TBH-1', name: '待補-1', targets: [3200, 2500, 2700, 3800, 3200, 3500, 4300, 3900, 5000, 4800, 5800, 6000], annual: 48700 },
    { id: 'TBH-2', name: '待補-2', targets: [3200, 2500, 2600, 3800, 3200, 3500, 4000, 3900, 5000, 4800, 5800, 6000], annual: 48300 },
  ])

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth')
    if (auth !== 'true') {
      router.push('/admin')
      return
    }
    setIsLoading(false)
  }, [router])

  const updateTarget = (memberId: string, monthIndex: number, value: number) => {
    setTeam(prev => prev.map(member => {
      if (member.id === memberId) {
        const newTargets = [...member.targets]
        newTargets[monthIndex] = value
        const newAnnual = newTargets.reduce((a, b) => a + b, 0)
        return { ...member, targets: newTargets, annual: newAnnual }
      }
      return member
    }))
  }

  const getTeamTotal = (monthIndex: number) => {
    return team.reduce((sum, member) => sum + member.targets[monthIndex], 0)
  }

  const getAnnualTotal = () => {
    return team.reduce((sum, member) => sum + member.annual, 0)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team })
      })
      if (response.ok) {
        alert('✅ 目標已儲存！')
      } else {
        alert('❌ 儲存失敗')
      }
    } catch (error) {
      alert('❌ 儲存失敗: ' + error)
    }
    setIsSaving(false)
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
            <h1 className="text-xl font-bold">🎯 目標管理</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? '儲存中...' : '💾 儲存'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 年度總覽 */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4">📊 2026 年度目標總覽</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{getAnnualTotal().toLocaleString()}K</div>
              <div className="text-sm text-gray-600">年度總目標</div>
            </div>
            {team.map(member => (
              <div key={member.id} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-700">{member.annual.toLocaleString()}K</div>
                <div className="text-sm text-gray-600">{member.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 月度目標表格 */}
        <div className="bg-white p-6 rounded-xl shadow-sm overflow-x-auto">
          <h2 className="text-lg font-bold mb-4">📅 月度目標設定</h2>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 bg-gray-50">業務</th>
                {months.map((month, i) => (
                  <th key={i} className="text-center p-3 bg-gray-50 text-sm">{month}</th>
                ))}
                <th className="text-center p-3 bg-blue-50 text-sm font-bold">年度</th>
              </tr>
            </thead>
            <tbody>
              {team.map(member => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-semibold">{member.name}</td>
                  {member.targets.map((target, i) => (
                    <td key={i} className="p-2 text-center">
                      <input
                        type="number"
                        value={target}
                        onChange={(e) => updateTarget(member.id, i, parseInt(e.target.value) || 0)}
                        className="w-16 text-center p-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center font-bold text-blue-600">{member.annual.toLocaleString()}</td>
                </tr>
              ))}
              {/* 團隊總計 */}
              <tr className="bg-blue-50 font-bold">
                <td className="p-3">團隊總計</td>
                {months.map((_, i) => (
                  <td key={i} className="p-3 text-center">{getTeamTotal(i).toLocaleString()}</td>
                ))}
                <td className="p-3 text-center text-blue-600">{getAnnualTotal().toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm text-gray-500 mt-4">💡 單位：K (千元)</p>
        </div>
      </main>
    </div>
  )
}
