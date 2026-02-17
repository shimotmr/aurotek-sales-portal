'use client'

import { ClipboardList, Plus, FileText, Send, CheckCircle, Clock, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import { supabase } from '@/lib/supabase'

interface Quotation {
  id: number
  quotation_no: string
  quotation_date: string
  customer_name: string
  sales_rep_name: string
  total_amount: number
  status: string
  valid_days: number
  dealer_id: string | null
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: 'var(--text-secondary)', bg: 'var(--surface-2)' },
  submitted: { label: '已送出', color: 'var(--accent-blue-500)', bg: 'rgba(14, 165, 233, 0.15)' },
  approved: { label: '已核准', color: 'var(--status-success)', bg: 'rgba(34, 197, 94, 0.15)' },
  rejected: { label: '已退回', color: 'var(--status-error)', bg: 'rgba(239, 68, 68, 0.15)' },
  expired: { label: '已過期', color: 'var(--text-tertiary)', bg: 'var(--surface-2)' },
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadQuotations()
  }, [statusFilter])

  const loadQuotations = async () => {
    setLoading(true)
    let query = supabase
      .from('quotations')
      .select('id, quotation_no, quotation_date, customer_name, sales_rep_name, total_amount, status, valid_days, dealer_id')
      .order('created_at', { ascending: false })
      .limit(100)

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    setQuotations(data || [])
    setLoading(false)
  }

  const filtered = quotations.filter(q => {
    if (!search) return true
    const s = search.toLowerCase()
    return q.quotation_no.toLowerCase().includes(s) ||
      q.customer_name.toLowerCase().includes(s) ||
      q.sales_rep_name.toLowerCase().includes(s)
  })

  const formatPrice = (n: number) => new Intl.NumberFormat('zh-TW').format(n)
  const formatDate = (d: string) => {
    const date = new Date(d)
    return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`
  }

  // 計算統計數據
  const stats = {
    total: quotations.length,
    draft: quotations.filter(q => q.status === 'draft').length,
    submitted: quotations.filter(q => q.status === 'submitted').length,
    approved: quotations.filter(q => q.status === 'approved').length,
    totalAmount: quotations.reduce((sum, q) => sum + q.total_amount, 0)
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--surface-0)' }}
    >
      {/* 頁面標題區 - 手機版 */}
      <header 
        className="md:hidden sticky top-0 z-20 border-b"
        style={{ 
          backgroundColor: 'var(--surface-0)',
          borderColor: 'var(--surface-3)'
        }}
      >
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, var(--accent-orange-500), var(--primary-600))' }}
            >
              <FileText size={16} />
            </div>
            <span 
              className="font-bold text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              報價單
            </span>
          </div>
          <Link
            href="/quotations/new"
            className="text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
            style={{ backgroundColor: 'var(--primary-500)' }}
          >
            <Plus size={16} />
            新增
          </Link>
        </div>
      </header>

      {/* 桌面版佈局：左側邊欄 + 右側內容 */}
      <div className="quotations-layout hidden md:block">
        {/* 左側邊欄 */}
        <aside 
          className="quotation-sidebar"
          style={{ 
            backgroundColor: 'var(--surface-1)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--surface-3)'
          }}
        >
          {/* 頁面標題 */}
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, var(--accent-orange-500), var(--primary-600))' }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h2 
                className="font-bold text-lg"
                style={{ color: 'var(--text-primary)' }}
              >
                報價單
              </h2>
              <p 
                className="text-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                報價管理
              </p>
            </div>
          </div>

          {/* 快速動作按鈕 */}
          <div className="quick-actions mb-6">
            <Link
              href="/quotations/new"
              className="action-btn"
              style={{
                border: '2px solid var(--surface-3)',
                backgroundColor: 'var(--surface-0)'
              }}
            >
              <Plus size={20} style={{ color: 'var(--primary-500)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>新增報價</span>
            </Link>
            <button className="action-btn" style={{ border: '2px solid var(--surface-3)', backgroundColor: 'var(--surface-0)' }}>
              <Send size={20} style={{ color: 'var(--accent-blue-500)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>寄送報價</span>
            </button>
            <button className="action-btn" style={{ border: '2px solid var(--surface-3)', backgroundColor: 'var(--surface-0)' }}>
              <CheckCircle size={20} style={{ color: 'var(--status-success)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>核准</span>
            </button>
            <button className="action-btn" style={{ border: '2px solid var(--surface-3)', backgroundColor: 'var(--surface-0)' }}>
              <Clock size={20} style={{ color: 'var(--accent-yellow-500)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>追蹤</span>
            </button>
          </div>

          {/* 統計卡片 */}
          <div className="mb-6">
            <h3 
              className="text-sm font-semibold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              快速統計
            </h3>
            <div className="space-y-3">
              <div 
                className="card-stats"
              >
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>總報價單</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
              </div>
              <div 
                className="card-stats"
              >
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>總金額</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--primary-500)' }}>NT$ {formatPrice(stats.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* 狀態分布 */}
          <div>
            <h3 
              className="text-sm font-semibold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              狀態分布
            </h3>
            <div className="space-y-2">
              {[
                { key: 'draft', label: '草稿', count: stats.draft, color: 'var(--text-secondary)' },
                { key: 'submitted', label: '已送出', count: stats.submitted, color: 'var(--accent-blue-500)' },
                { key: 'approved', label: '已核准', count: stats.approved, color: 'var(--status-success)' },
              ].map(item => (
                <div 
                  key={item.key}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: 'var(--surface-2)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: item.color }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 右側主要內容 */}
        <main className="quotations-main">
          {/* 工具列 */}
          <div className="quotations-toolbar">
            <div className="flex items-center gap-4 flex-1">
              {/* 搜尋框 */}
              <div 
                className="relative flex-1 max-w-md"
                style={{ 
                  backgroundColor: 'var(--surface-1)',
                  borderRadius: '12px',
                  border: '1px solid var(--surface-3)'
                }}
              >
                <Search 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜尋報價單號 / 客戶 / 業務..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
            
            {/* 篩選按鈕 */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: '全部' },
                { key: 'draft', label: '草稿' },
                { key: 'submitted', label: '已送出' },
                { key: 'approved', label: '已核准' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: statusFilter === f.key ? 'var(--primary-500)' : 'var(--surface-1)',
                    color: statusFilter === f.key ? 'white' : 'var(--text-secondary)',
                    border: statusFilter === f.key ? 'none' : '1px solid var(--surface-3)'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 報價單列表 */}
          <div className="quotations-list">
            {loading ? (
              <div 
                className="text-center py-12"
                style={{ color: 'var(--text-tertiary)' }}
              >
                載入中...
              </div>
            ) : filtered.length === 0 ? (
              <div 
                className="text-center py-12"
                style={{ backgroundColor: 'var(--surface-1)', borderRadius: '16px', padding: '48px' }}
              >
                <ClipboardList size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>尚無報價單</p>
                <Link
                  href="/quotations/new"
                  className="inline-block text-white px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: 'var(--primary-500)' }}
                >
                  建立第一張報價單
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(q => {
                  const st = STATUS_MAP[q.status] || STATUS_MAP.draft
                  return (
                    <Link
                      key={q.id}
                      href={`/quotations/${q.id}`}
                      className="quotation-item block"
                      style={{
                        backgroundColor: 'var(--surface-1)',
                        borderRadius: '12px',
                        padding: '16px',
                        borderLeft: '4px solid transparent',
                        border: '1px solid var(--surface-3)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span 
                            className="font-mono text-sm font-bold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {q.quotation_no}
                          </span>
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: st.bg, color: st.color }}
                          >
                            {st.label}
                          </span>
                        </div>
                        <span 
                          className="font-bold text-lg"
                          style={{ color: 'var(--primary-500)' }}
                        >
                          NT$ {formatPrice(q.total_amount)}
                        </span>
                      </div>
                      <div 
                        className="flex justify-between text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span>{q.customer_name} · {q.sales_rep_name}</span>
                        <span>{formatDate(q.quotation_date)}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 手機版佈局：單欄設計 */}
      <div className="md:hidden px-4 py-4">
        {/* 搜尋框 */}
        <div 
          className="relative mb-4"
          style={{ 
            backgroundColor: 'var(--surface-1)',
            borderRadius: '12px',
            border: '1px solid var(--surface-3)'
          }}
        >
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋報價單號 / 客戶 / 業務..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* 篩選按鈕 - 可橫向滾動 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { key: 'all', label: '全部' },
            { key: 'draft', label: '草稿' },
            { key: 'submitted', label: '已送出' },
            { key: 'approved', label: '已核准' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{
                backgroundColor: statusFilter === f.key ? 'var(--primary-500)' : 'var(--surface-1)',
                color: statusFilter === f.key ? 'white' : 'var(--text-secondary)',
                border: statusFilter === f.key ? 'none' : '1px solid var(--surface-3)'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 列表 */}
        {loading ? (
          <div 
            className="text-center py-12"
            style={{ color: 'var(--text-tertiary)' }}
          >
            載入中...
          </div>
        ) : filtered.length === 0 ? (
          <div 
            className="text-center py-8"
            style={{ backgroundColor: 'var(--surface-1)', borderRadius: '16px', padding: '32px' }}
          >
            <ClipboardList size={40} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>尚無報價單</p>
            <Link
              href="/quotations/new"
              className="inline-block text-white px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--primary-500)' }}
            >
              建立第一張報價單
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(q => {
              const st = STATUS_MAP[q.status] || STATUS_MAP.draft
              return (
                <Link
                  key={q.id}
                  href={`/quotations/${q.id}`}
                  className="block"
                  style={{
                    backgroundColor: 'var(--surface-1)',
                    borderRadius: '12px',
                    padding: '14px',
                    border: '1px solid var(--surface-3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-mono text-sm font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {q.quotation_no}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <span 
                      className="font-bold"
                      style={{ color: 'var(--primary-500)' }}
                    >
                      NT$ {formatPrice(q.total_amount)}
                    </span>
                  </div>
                  <div 
                    className="flex justify-between text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <span>{q.customer_name} · {q.sales_rep_name}</span>
                    <span>{formatDate(q.quotation_date)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
