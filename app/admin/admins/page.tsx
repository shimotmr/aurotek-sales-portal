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

const RoleIcon = ({ role }: { role: string }) => role === 'super_admin' ? (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M10 2l2.5 3H15l-1.5 3L15 11H5l1.5-3L5 5h2.5L10 2z" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
    <rect x="6" y="12" width="8" height="4" rx="1" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
  </svg>
) : (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <circle cx="10" cy="7" r="3" stroke="#64748B" strokeWidth="1.5"/>
    <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export default function AdminsManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [form, setForm] = useState({ employee_id: '', email: '', nickname: '', role: 'admin' as const, name: '', title: '' })
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ email: '', nickname: '', role: 'admin' as string })
  const [lookupLoading, setLookupLoading] = useState(false)

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admins')
      if (res.ok) { const data = await res.json(); setAdmins(data.admins || []) }
    } catch {}
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const gc = (n: string) => { const v = `; ${document.cookie}`; const p = v.split(`; ${n}=`); return p.length === 2 ? p.pop()?.split(';').shift() || '' : '' }
    const sa = gc('is_super_admin') === 'true'
    setIsSuperAdmin(sa)
    if (sa) fetchAdmins()
    else setIsLoading(false)
  }, [fetchAdmins])

  const flash = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const lookupEmployee = async (eid: string) => {
    if (!eid || eid.length < 2) return
    setLookupLoading(true)
    try {
      const res = await fetch(`/api/employees/lookup?employee_id=${encodeURIComponent(eid)}`)
      if (res.ok) {
        const data = await res.json()
        setForm(prev => ({
          ...prev,
          name: data.name || '',
          email: data.email || '',
          nickname: data.name || '',
          title: data.title || '',
        }))
        flash('ok', `已帶入 ${data.name} 的資料`)
      }
    } catch {}
    setLookupLoading(false)
  }

  const handleAdd = async () => {
    if (!form.employee_id) return
    const res = await fetch('/api/admins', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      flash('ok', `已新增 ${form.nickname || form.employee_id}`)
      setForm({ employee_id: '', email: '', nickname: '', role: 'admin', name: '', title: '' })
      setShowForm(false)
      fetchAdmins()
    } else flash('err', data.error || '新增失敗')
  }

  const handleRemove = async (admin: Admin) => {
    if (!confirm(`確定移除 ${admin.nickname || admin.employee_id}？`)) return
    const res = await fetch('/api/admins', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: admin.employee_id }),
    })
    if (res.ok) { flash('ok', '已移除'); fetchAdmins() }
    else { const d = await res.json(); flash('err', d.error || '移除失敗') }
  }

  const startEdit = (a: Admin) => {
    setEditing(a.employee_id)
    setEditForm({ email: a.email || '', nickname: a.nickname || '', role: a.role })
  }

  const handleUpdate = async (eid: string) => {
    const res = await fetch('/api/admins', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: eid, ...editForm }),
    })
    if (res.ok) { flash('ok', '已更新'); setEditing(null); fetchAdmins() }
    else flash('err', '更新失敗')
  }

  if (!isSuperAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 text-center max-w-sm w-full shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" className="w-7 h-7"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <h1 className="text-base font-bold text-slate-800 mb-1">權限不足</h1>
          <p className="text-sm text-slate-400">需要超級管理員權限</p>
        </div>
      </div>
    )
  }

  const superCount = admins.filter(a => a.role === 'super_admin').length
  const adminCount = admins.filter(a => a.role === 'admin').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Toast */}
      {msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all ${
          msg.type === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>{msg.text}</div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-slate-800">{admins.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">全部</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-amber-500">{superCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">超級管理</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{adminCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">一般管理</div>
          </div>
        </div>

        {/* Add Button / Form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all"
          >
            + 新增管理員
          </button>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">新增管理員</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              {/* 工號 + 查詢按鈕 */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">工號 *（輸入後點查詢自動帶入資料）</label>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="u1234"
                    value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupEmployee(form.employee_id) } }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => lookupEmployee(form.employee_id)}
                    disabled={!form.employee_id || lookupLoading}
                    className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 disabled:opacity-40 transition whitespace-nowrap"
                  >
                    {lookupLoading ? '查詢中...' : '🔍 查詢'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">姓名</label>
                  <input
                    type="text" placeholder="王小明"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">職稱</label>
                  <input
                    type="text" placeholder="經理"
                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">別名</label>
                  <input
                    type="text" placeholder="暱稱"
                    value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">郵箱</label>
                  <input
                    type="text" placeholder="wang@aurotek.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">權限</label>
                <select
                  value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none bg-white"
                >
                  <option value="admin">一般管理員</option>
                  <option value="super_admin">超級管理員</option>
                </select>
              </div>
              <button
                onClick={handleAdd} disabled={!form.employee_id}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition"
              >
                確認新增
              </button>
            </div>
          </div>
        )}

        {/* Admin List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-sm text-slate-400">載入中...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">尚無管理員</div>
          ) : admins.map(admin => (
            <div key={admin.employee_id}
              className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {editing === admin.employee_id ? (
                /* Edit Mode */
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-500">{admin.employee_id}</span>
                    <span className="text-[11px] text-blue-500">編輯中</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text" placeholder="別名"
                      value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                    />
                    <input
                      type="text" placeholder="郵箱"
                      value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                    />
                    <select
                      value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none bg-white"
                    >
                      <option value="admin">一般管理員</option>
                      <option value="super_admin">超級管理員</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(admin.employee_id)}
                      className="flex-1 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition">儲存</button>
                    <button onClick={() => setEditing(null)}
                      className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition">取消</button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    admin.role === 'super_admin' ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'
                  }`}>
                    <RoleIcon role={admin.role} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 truncate">
                        {admin.nickname || admin.employee_id}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-400 shrink-0">
                        {admin.employee_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 truncate">
                        {admin.email || '未設定郵箱'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                        admin.role === 'super_admin'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}>
                        {admin.role === 'super_admin' ? '超級管理' : '管理員'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => startEdit(admin)}
                      className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                    </button>
                    {admin.employee_id !== 'williamhsiao' && (
                      <button onClick={() => handleRemove(admin)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-slate-300 mt-6">
          Supabase 持久化存儲 · 部署不會遺失
        </p>
      </div>
    </div>
  )
}
