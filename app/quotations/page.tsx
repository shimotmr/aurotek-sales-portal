'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
  draft: { label: '草稿', color: '#6B7280', bg: '#F3F4F6' },
  submitted: { label: '已送出', color: '#2563EB', bg: '#DBEAFE' },
  approved: { label: '已核准', color: '#059669', bg: '#D1FAE5' },
  rejected: { label: '已退回', color: '#DC2626', bg: '#FEE2E2' },
  expired: { label: '已過期', color: '#9CA3AF', bg: '#F3F4F6' },
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>
            </div>
            <span className="font-bold text-slate-800 text-sm sm:text-base">報價單管理</span>
          </div>
          <Link
            href="/quotations/new"
            className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#E60012' }}
          >
            + 新增報價單
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋報價單號 / 客戶 / 業務..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
          />
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: 'all', label: '全部' },
              { key: 'draft', label: '草稿' },
              { key: 'submitted', label: '已送出' },
              { key: 'approved', label: '已核准' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === f.key
                    ? 'text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
                style={statusFilter === f.key ? { backgroundColor: '#E60012' } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 mb-4">尚無報價單</p>
            <Link
              href="/quotations/new"
              className="inline-block text-white px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#E60012' }}
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
                  className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-sm font-bold text-gray-800">{q.quotation_no}</span>
                      <span
                        className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <span className="font-bold" style={{ color: '#E60012' }}>
                      NT$ {formatPrice(q.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
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
