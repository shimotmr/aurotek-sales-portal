'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Product {
  aurotek_pn: string
  name: string
  spec: string | null
  material_type_name: string | null
  list_price: number | null
  dealer_price: number | null
  market_floor_price: number | null
  total_qty: number
}

interface QuoteItem {
  aurotek_pn: string
  item_name: string
  unit: string
  quantity: number
  unit_price: number
  amount: number
}

interface Dealer {
  id: string
  name: string
  contact: string | null
  phone: string | null
  address: string | null
}

interface TeamMember {
  id: string
  name: string
  email: string | null
}

const DEFAULT_NOTES = `1.此報價單有效日期為7天。
2.單筆訂單未滿新台幣3,000元將酌收運費或運費到付。
3.如需訂購，請傳訂購單或回傳此報價書並加蓋公司章作為訂購証明。
4.下單前確認規格是否無誤；訂購確認後，非經賣方同意，買方不得取消訂單。
5.此文件經客戶簽署後，將被視為正式訂單。
6.貨款未付清及票據未兌現前，貨品所有權概屬賣方所有。
7.本公司保留接受訂單與否權利。`

const REP_EXT: Record<string, string> = {
  'u2625': '7509',
  'u2668': '',
  'u2671': '',
}

export default function NewQuotationPage() {
  const router = useRouter()
  
  // Data sources
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  
  // Form - customer
  const [dealerId, setDealerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  
  // Form - sales rep
  const [salesRepId, setSalesRepId] = useState('')
  const [salesRepName, setSalesRepName] = useState('')
  const [salesRepExt, setSalesRepExt] = useState('')
  const [salesRepEmail, setSalesRepEmail] = useState('')
  
  // Form - terms
  const [paymentTerms, setPaymentTerms] = useState('現金')
  const [validDays, setValidDays] = useState(7)
  const [taxRate, setTaxRate] = useState(5)
  const [notes, setNotes] = useState(DEFAULT_NOTES)
  
  // Items
  const [items, setItems] = useState<QuoteItem[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  
  // Save state
  const [saving, setSaving] = useState(false)

  // Load dealers & team
  useEffect(() => {
    supabase.from('dealers').select('id, name, contact, phone, address')
      .eq('status', 'active').order('name')
      .then(({ data }) => setDealers(data || []))
    supabase.from('team').select('id, name, email')
      .eq('status', 'active').order('name')
      .then(({ data }) => setTeam(data || []))
  }, [])

  // Auto-fill dealer info
  const handleDealerChange = (id: string) => {
    setDealerId(id)
    if (id) {
      const d = dealers.find(d => d.id === id)
      if (d) {
        setCustomerName(d.name)
        setCustomerContact(d.contact || '')
        setCustomerPhone(d.phone || '')
        setCustomerAddress(d.address || '')
        setDeliveryAddress(d.address || '')
      }
    }
  }

  // Auto-fill sales rep info
  const handleRepChange = (id: string) => {
    setSalesRepId(id)
    if (id) {
      const r = team.find(t => t.id === id)
      if (r) {
        setSalesRepName(r.name)
        setSalesRepEmail(r.email || '')
        setSalesRepExt(REP_EXT[r.id] || '')
      }
    }
  }

  // Search products
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('products_full')
        .select('aurotek_pn, name, spec, material_type_name, list_price, dealer_price, market_floor_price, total_qty')
        .eq('is_active', true)
        .or(`aurotek_pn.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .order('aurotek_pn')
        .limit(15)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addItem = (p: Product) => {
    if (items.some(i => i.aurotek_pn === p.aurotek_pn)) { return }
    const price = p.dealer_price || p.list_price || 0
    setItems([...items, {
      aurotek_pn: p.aurotek_pn,
      item_name: p.name + (p.spec ? `(${p.spec})` : ''),
      unit: 'SET',
      quantity: 1,
      unit_price: price,
      amount: price
    }])
    setSearchQuery('')
    setSearchResults([])
    setShowSearch(false)
  }

  const updateItem = (idx: number, field: string, value: number | string) => {
    const newItems = [...items]
    const item = { ...newItems[idx], [field]: value }
    if (field === 'quantity' || field === 'unit_price') {
      item.amount = item.quantity * item.unit_price
    }
    newItems[idx] = item
    setItems(newItems)
  }

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const taxAmount = Math.round(subtotal * taxRate / 100)
  const totalAmount = subtotal + taxAmount

  const fmt = (n: number) => new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  const saveQuotation = async () => {
    if (!customerName) { alert('請填寫客戶名稱'); return }
    if (!salesRepName) { alert('請選擇業務代表'); return }
    if (items.length === 0) { alert('請至少加入一項產品'); return }

    setSaving(true)
    try {
      // Get next quotation number
      const now = new Date()
      const ym = String(now.getFullYear()).slice(-2) + String(now.getMonth()+1).padStart(2,'0')
      
      // Upsert sequence
      const { data: seqData } = await supabase
        .from('quotation_sequences')
        .upsert({ year_month: ym, last_serial: 10001 }, { onConflict: 'year_month' })
        .select()
        .single()
      
      let serial = 10001
      if (seqData) {
        // Increment
        const { data: updated } = await supabase
          .from('quotation_sequences')
          .update({ last_serial: seqData.last_serial + 1 })
          .eq('year_month', ym)
          .select()
          .single()
        serial = updated?.last_serial || seqData.last_serial + 1
      }

      const quotationNo = `ASAA-${ym}${String(serial).padStart(6, '0')}`

      // Insert quotation
      const { data: q, error: qErr } = await supabase.from('quotations').insert({
        quotation_no: quotationNo,
        quotation_date: now.toISOString().split('T')[0],
        valid_days: validDays,
        dealer_id: dealerId || null,
        customer_name: customerName,
        customer_address: customerAddress || null,
        customer_contact: customerContact || null,
        customer_phone: customerPhone || null,
        delivery_address: deliveryAddress || null,
        sales_rep_id: salesRepId || null,
        sales_rep_name: salesRepName,
        sales_rep_ext: salesRepExt || null,
        sales_rep_email: salesRepEmail || null,
        payment_terms: paymentTerms,
        currency: 'TWD',
        subtotal: subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: notes || null,
        status: 'draft'
      }).select().single()

      if (qErr) throw qErr

      // Insert items
      const { error: iErr } = await supabase.from('quotation_items').insert(
        items.map((item, idx) => ({
          quotation_id: q.id,
          aurotek_pn: item.aurotek_pn,
          item_name: item.item_name,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          sort_order: idx
        }))
      )
      if (iErr) throw iErr

      router.push(`/quotations/${q.id}`)
    } catch (err) {
      alert('儲存失敗：' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/quotations" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">新增報價單</h1>
          </div>
          <button
            onClick={saveQuotation}
            disabled={saving}
            className="text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#E60012' }}
          >
            {saving ? '儲存中...' : '💾 儲存'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Customer Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">👤 客戶資訊</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">經銷商（選填）</label>
              <select value={dealerId} onChange={e => handleDealerChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300">
                <option value="">-- 手動輸入 --</option>
                {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">客戶名稱 *</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
                placeholder="客戶名稱" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">客戶地址</label>
              <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
                placeholder="地址" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">聯絡人</label>
              <input value={customerContact} onChange={e => setCustomerContact(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">電話</label>
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">交貨地點</label>
              <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
                placeholder="預設同客戶地址" />
            </div>
          </div>
        </div>

        {/* Sales Rep Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">👔 業務代表</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">業務 *</label>
              <select value={salesRepId} onChange={e => handleRepChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300">
                <option value="">-- 選擇 --</option>
                {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">分機</label>
              <input value={salesRepExt} onChange={e => setSalesRepExt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input value={salesRepEmail} onChange={e => setSalesRepEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300" />
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">⚙️ 交易條件</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">交易條件</label>
              <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300">
                <option>現金</option>
                <option>月結30天</option>
                <option>月結60天</option>
                <option>月結90天</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">有效天數</label>
              <input type="number" value={validDays} onChange={e => setValidDays(parseInt(e.target.value)||7)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">稅率 %</label>
              <input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value)||0)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-gray-700">📦 產品明細</h2>
            <button onClick={() => setShowSearch(true)}
              className="text-white px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: '#E60012' }}>
              + 加入產品
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">點擊「+ 加入產品」搜尋料號或品名</div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">料號 / 品名</th>
                      <th className="text-center py-2 px-1 text-xs text-gray-500 font-medium w-16">數量</th>
                      <th className="text-right py-2 px-1 text-xs text-gray-500 font-medium w-24">單價</th>
                      <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium w-24">總價</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-2">
                          <div className="font-mono text-xs text-gray-400">{item.aurotek_pn}</div>
                          <div className="text-sm text-gray-800 truncate max-w-[200px]">{item.item_name}</div>
                        </td>
                        <td className="py-2 px-1">
                          <input type="number" min={1} value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value)||1)}
                            className="w-14 px-1 py-1 border rounded text-center text-sm" />
                        </td>
                        <td className="py-2 px-1">
                          <input type="number" value={item.unit_price}
                            onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value)||0)}
                            className="w-22 px-1 py-1 border rounded text-right text-sm" />
                        </td>
                        <td className="py-2 px-2 text-right font-medium">{fmt(item.amount)}</td>
                        <td className="py-2">
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-3 pt-3 border-t space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>銷售金額(未稅)</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>營業稅 ({taxRate}%)</span>
                  <span>{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t">
                  <span>銷售金額 合計</span>
                  <span style={{ color: '#E60012' }}>TWD {fmt(totalAmount)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">📝 備註</h2>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={7}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:border-red-300" />
        </div>

        {/* Bottom Save */}
        <div className="pb-8">
          <button onClick={saveQuotation} disabled={saving}
            className="w-full text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ backgroundColor: '#E60012' }}>
            {saving ? '儲存中...' : '💾 儲存報價單'}
          </button>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">搜尋產品</h3>
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}
                className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-4">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="輸入料號或品名..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
                autoFocus />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {searching ? (
                <p className="text-center py-6 text-gray-400 text-sm">搜尋中...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-sm">
                  {searchQuery.length < 2 ? '輸入至少 2 字元' : '找不到產品'}
                </p>
              ) : (
                searchResults.map(p => (
                  <div key={p.aurotek_pn} onClick={() => addItem(p)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b flex justify-between items-center">
                    <div>
                      <div className="font-mono text-xs text-gray-400">{p.aurotek_pn}</div>
                      <div className="text-sm font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        牌價 {fmt(p.list_price||0)} · 經銷價 {fmt(p.dealer_price||0)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 ml-2">
                      {p.total_qty > 0 ? `庫存 ${p.total_qty}` : '無庫存'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
