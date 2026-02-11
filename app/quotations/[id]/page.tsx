'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Quotation {
  id: number
  quotation_no: string
  quotation_date: string
  valid_days: number
  dealer_id: string | null
  customer_name: string
  customer_address: string | null
  customer_contact: string | null
  customer_phone: string | null
  delivery_address: string | null
  sales_rep_id: string | null
  sales_rep_name: string
  sales_rep_ext: string | null
  sales_rep_email: string | null
  payment_terms: string
  currency: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  notes: string | null
  status: string
  created_at: string
}

interface QuotationItem {
  id: number
  aurotek_pn: string | null
  item_name: string
  unit: string
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#6B7280', bg: '#F3F4F6' },
  submitted: { label: '已送出', color: '#2563EB', bg: '#DBEAFE' },
  approved: { label: '已核准', color: '#059669', bg: '#D1FAE5' },
  rejected: { label: '已退回', color: '#DC2626', bg: '#FEE2E2' },
  expired: { label: '已過期', color: '#9CA3AF', bg: '#F3F4F6' },
}

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [items, setItems] = useState<QuotationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const [{ data: q }, { data: i }] = await Promise.all([
      supabase.from('quotations').select('*').eq('id', id).single(),
      supabase.from('quotation_items').select('*').eq('quotation_id', id).order('sort_order')
    ])
    setQuotation(q)
    setItems(i || [])
    setLoading(false)
  }

  const fmt = (n: number) => new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
  const formatDate = (d: string) => {
    const date = new Date(d)
    return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`
  }

  const generatePDF = async () => {
    if (!quotation) return
    setGenerating(true)
    try {
      const res = await fetch('/api/quotations/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation, items })
      })
      if (!res.ok) throw new Error('PDF 生成失敗')
      const html = await res.text()
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(html)
        w.document.close()
        setTimeout(() => w.print(), 500)
      }
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!quotation) return
    await supabase.from('quotations').update({ status: newStatus }).eq('id', quotation.id)
    setQuotation({ ...quotation, status: newStatus })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">載入中...</div>
  if (!quotation) return <div className="min-h-screen flex items-center justify-center text-gray-400">找不到報價單</div>

  const st = STATUS_MAP[quotation.status] || STATUS_MAP.draft
  const validUntil = new Date(quotation.quotation_date)
  validUntil.setDate(validUntil.getDate() + quotation.valid_days)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/quotations" className="text-slate-400 hover:text-slate-600 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm sm:text-base font-mono">{quotation.quotation_no}</span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: st.bg, color: st.color }}>
                {st.label}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generatePDF} disabled={generating}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
              {generating ? '⏳' : '📄'} PDF
            </button>
            {quotation.status === 'draft' && (
              <button onClick={() => updateStatus('submitted')}
                className="text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#E60012' }}>
                送出
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Preview - ERP Style */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {/* Company Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">和椿科技股份有限公司</h2>
            <h3 className="text-lg font-bold text-gray-700 mt-1">報 價 單</h3>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
            <div className="flex">
              <span className="text-gray-500 w-20 shrink-0">報價單號：</span>
              <span className="font-mono font-bold">{quotation.quotation_no}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-20 shrink-0">報價日期：</span>
              <span>{formatDate(quotation.quotation_date)}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-20 shrink-0">客戶資料：</span>
              <span>{quotation.customer_name}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-20 shrink-0">業務代表：</span>
              <span>{quotation.sales_rep_name}{quotation.sales_rep_ext ? ` 分機(${quotation.sales_rep_ext})` : ''}</span>
            </div>
            {quotation.customer_address && (
              <div className="flex col-span-2">
                <span className="text-gray-500 w-20 shrink-0">地址：</span>
                <span>{quotation.customer_address}</span>
              </div>
            )}
            {quotation.delivery_address && (
              <div className="flex col-span-2">
                <span className="text-gray-500 w-20 shrink-0">交貨地點：</span>
                <span>{quotation.delivery_address}</span>
              </div>
            )}
            <div className="flex">
              <span className="text-gray-500 w-20 shrink-0">交易條件：</span>
              <span>{quotation.payment_terms}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-20 shrink-0">有效期限：</span>
              <span>{formatDate(validUntil.toISOString())}（{quotation.valid_days}天）</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border-y">
                  <th className="py-2 px-2 text-left font-medium text-gray-600">料號</th>
                  <th className="py-2 px-2 text-left font-medium text-gray-600">品名/規格</th>
                  <th className="py-2 px-2 text-center font-medium text-gray-600">單位</th>
                  <th className="py-2 px-2 text-center font-medium text-gray-600">數量</th>
                  <th className="py-2 px-2 text-right font-medium text-gray-600">單價</th>
                  <th className="py-2 px-2 text-right font-medium text-gray-600">總價</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 px-2 font-mono text-xs text-gray-600">{item.aurotek_pn || '-'}</td>
                    <td className="py-2 px-2">{item.item_name}</td>
                    <td className="py-2 px-2 text-center">{item.unit}</td>
                    <td className="py-2 px-2 text-center">{item.quantity}</td>
                    <td className="py-2 px-2 text-right">{fmt(item.unit_price)}</td>
                    <td className="py-2 px-2 text-right font-medium">{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">銷售金額(未稅):</span>
                <span>{fmt(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">營業稅 ({quotation.tax_rate}%):</span>
                <span>{fmt(quotation.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>銷售金額 合計:</span>
                <span>{quotation.currency} {fmt(quotation.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-bold text-gray-700 mb-2">備註：</h4>
              <div className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{quotation.notes}</div>
            </div>
          )}

          {/* Company footer */}
          <div className="mt-6 pt-4 border-t text-xs text-gray-400 flex justify-between">
            <div>
              <div>公司電話：886-2-8752-3311</div>
              <div>公司地址：114台北市內湖區洲子街60號2樓</div>
            </div>
            <div className="text-right">
              <div>製表者：{quotation.sales_rep_id || '-'}</div>
              <div>製表日期：{formatDate(quotation.created_at)}</div>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        {quotation.status === 'submitted' && (
          <div className="flex gap-2">
            <button onClick={() => updateStatus('approved')}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
              ✅ 核准
            </button>
            <button onClick={() => updateStatus('rejected')}
              className="flex-1 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-200">
              ❌ 退回
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
