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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <h1 className="text-lg font-bold text-gray-900">📋 報價單管理</h1>
            </div>
            <Link
              href="/quotations/new"
              className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#E60012' }}
            >
              + 新增報價單
            </Link>
          </div>
        </div>
      </div>

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
