'use client'

import { useState, useEffect, useCallback } from 'react'

interface Admin {
  id: number
  employee_id: string
  email: string | null
  nickname: string | null
  role: 'admin' | 'super_admin'
  added_by: string
  created_at: string
}

export default function AdminsManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [form, setForm] = useState({ employee_id: '', email: '', nickname: '', role: 'admin' as const })
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ email: '', nickname: '', role: 'admin' as string })

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admins')
      if (res.ok) { const data = await res.json(); setAdmins(data.admins || []) }
      else if (res.status === 403) setMsg({ type: 'err', text: '權限不足' })
    } catch { setMsg({ type: 'err', text: '讀取管理員名單失敗' }) }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const gc = (n: string) => { const v = `; ${document.cookie}`; const p = v.split(`; ${n}=`); return p.length === 2 ? p.pop()?.split(';').shift() || '' : '' }
    const sa = gc('is_super_admin') === 'true'
    setIsSuperAdmin(sa)
    setCurrentUser(gc('user_name') || '')
    if (sa) fetchAdmins()
    else setIsLoading(false)
  }, [fetchAdmins])

  const flash = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const handleAdd = async () => {
    if (!form.employee_id) return
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) { flash('ok', `已新增：${form.nickname || form.employee_id}`); setForm({ employee_id: '', email: '', nickname: '', role: 'admin' }); fetchAdmins() }
      else flash('err', data.error || '新增失敗')
    } catch { flash('err', '新增失敗') }
  }

  const handleRemove = async (admin: Admin) => {
    if (!confirm(`確定移除 ${admin.nickname || admin.employee_id}？`)) return
    try {
      const res = await fetch('/api/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: admin.employee_id }),
      })
      if (res.ok) { flash('ok', `已移除：${admin.nickname || admin.employee_id}`); fetchAdmins() }
      else { const d = await res.json(); flash('err', d.error || '移除失敗') }
    } catch { flash('err', '移除失敗') }
  }

  const startEdit = (admin: Admin) => {
    setEditing(admin.employee_id)
    setEditForm({ email: admin.email || '', nickname: admin.nickname || '', role: admin.role })
  }

  const handleUpdate = async (employee_id: string) => {
    try {
      const res = await fetch('/api/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id, ...editForm }),
      })
      if (res.ok) { flash('ok', '已更新'); setEditing(null); fetchAdmins() }
      else flash('err', '更新失敗')
    } catch { flash('err', '更新失敗') }
  }

  if (!isSuperAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-slate-400"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-1">權限不足</h1>
          <p className="text-sm text-slate-500">只有超級管理員可以存取此頁面</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Toast */}
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Add Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">新增管理員</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">工號（登入帳號）<span className="text-red-400">*</span></label>
              <input
                type="text" placeholder="如 u1234"
                value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">別名（中文名字）</label>
              <input
                type="text" placeholder="如 王小明"
                value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">郵箱</label>
              <input
                type="text" placeholder="如 wang@aurotek.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">權限</label>
              <select
                value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none bg-white"
              >
                <option value="admin">一般管理員</option>
                <option value="super_admin">超級管理員</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleAdd} disabled={!form.employee_id}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            新增
          </button>
        </div>

        {/* Admin List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">管理員名單 ({admins.length})</h2>
            <button onClick={fetchAdmins} className="text-xs text-blue-600 hover:text-blue-800">重新整理</button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">載入中...</div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">沒有管理員</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {admins.map(admin => (
                <div key={admin.employee_id} className="px-5 py-4">
                  {editing === admin.employee_id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono font-bold text-slate-800">{admin.employee_id}</span>
                        <span className="text-xs text-slate-400">編輯中</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text" placeholder="別名" value={editForm.nickname}
                          onChange={e => setEditForm({ ...editForm, nickname: e.target.value })}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                        />
                        <input
                          type="text" placeholder="郵箱" value={editForm.email}
                          onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                        />
                        <select
                          value={editForm.role}
                          onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-blue-400 focus:outline-none"
                        >
                          <option value="admin">一般管理員</option>
                          <option value="super_admin">超級管理員</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(admin.employee_id)} className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">儲存</button>
                        <button onClick={() => setEditing(null)} className="px-4 py-1.5 text-slate-500 text-xs rounded-lg hover:bg-slate-100">取消</button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">
                            {admin.nickname || admin.employee_id}
                          </span>
                          {admin.nickname && (
                            <span className="text-xs font-mono text-slate-400">{admin.employee_id}</span>
                          )}
                          {admin.role === 'super_admin' ? (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-medium border border-amber-200">超級管理</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium border border-blue-200">管理員</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {admin.email || '未設定郵箱'}
                          <span className="mx-1.5">·</span>
                          {admin.created_at?.split('T')[0]}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEdit(admin)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                        </button>
                        {admin.employee_id !== 'williamhsiao' && (
                          <button onClick={() => handleRemove(admin)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-slate-400 text-center">
          資料儲存於 Supabase · 部署不會遺失
        </div>
      </div>
    </div>
  )
}
