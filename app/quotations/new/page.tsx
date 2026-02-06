'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Product {
  id: number
  aurotek_pn: string
  pudu_pn: string | null
  name: string
  spec: string | null
  material_type_name: string | null
  list_price: number | null
  total_qty: number
}

interface QuoteItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
}

interface Dealer {
  id: string
  name: string
  contact: string | null
}

export default function NewQuotationPage() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [selectedDealer, setSelectedDealer] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [validDays, setValidDays] = useState(30)
  const [notes, setNotes] = useState('')
  
  const [items, setItems] = useState<QuoteItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [savedQuoteNo, setSavedQuoteNo] = useState<string | null>(null)

  // Load dealers
  useEffect(() => {
    supabase.from('dealers').select('id, name, contact').eq('status', 'active').order('name')
      .then(({ data }) => setDealers(data || []))
  }, [])

  // Search products - 使用新的 products_full 視圖
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('products_full')
        .select('id, aurotek_pn, pudu_pn, name, spec, material_type_name, list_price, total_qty')
        .eq('is_active', true)
        .or(`aurotek_pn.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,pudu_pn.ilike.%${searchQuery}%`)
        .order('aurotek_pn')
        .limit(15)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addItem = (product: Product) => {
    // 檢查是否已加入
    if (items.some(item => item.product.id === product.id)) {
      alert('此產品已在報價單中')
      return
    }
    const price = product.list_price || 0
    setItems([...items, { product, quantity: 1, unitPrice: price, discount: 0 }])
    setSearchQuery('')
    setSearchResults([])
    setShowSearch(false)
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateSubtotal = (item: QuoteItem) => {
    return item.quantity * item.unitPrice * (1 - item.discount / 100)
  }

  const total = items.reduce((sum, item) => sum + calculateSubtotal(item), 0)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(price)
  }

  const generateQuoteNo = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
    return `Q${year}${month}${day}${rand}`
  }

  const saveQuotation = async () => {
    if (items.length === 0) {
      alert('請至少加入一項產品')
      return
    }

    setSaving(true)
    try {
      const quotationNo = generateQuoteNo()
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + validDays)

      // Insert quotation - 使用新的 schema
      const { data: quotation, error: qError } = await supabase
        .from('quotations')
        .insert({
          quotation_no: quotationNo,
          customer_name: customerName || null,
          customer_contact: customerContact || null,
          customer_phone: customerPhone || null,
          customer_email: customerEmail || null,
          quote_date: new Date().toISOString().split('T')[0],
          valid_until: validUntil.toISOString().split('T')[0],
          currency: 'TWD',
          subtotal: total,
          discount_percent: 0,
          discount_amount: 0,
          tax_percent: 0,
          tax_amount: 0,
          total_amount: total,
          status: 'draft',
          notes: notes || null,
          created_by: 'portal'
        })
        .select()
        .single()

      if (qError) throw qError

      // Insert items - 使用新的 schema
      const itemsToInsert = items.map((item, index) => ({
        quotation_id: quotation.id,
        product_id: item.product.id,
        aurotek_pn: item.product.aurotek_pn,
        product_name: item.product.name,
        product_spec: item.product.spec,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discount,
        line_total: calculateSubtotal(item),
        sort_order: index
      }))

      const { error: iError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert)

      if (iError) throw iError

      setSavedQuoteNo(quotationNo)
    } catch (err) {
      console.error('Error saving quotation:', err)
      alert('儲存失敗：' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setItems([])
    setCustomerName('')
    setCustomerContact('')
    setCustomerPhone('')
    setCustomerEmail('')
    setNotes('')
    setSelectedDealer('')
    setSavedQuoteNo(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/products" className="text-gray-500 hover:text-gray-700 text-xl">←</Link>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">新增報價單</h1>
            </div>
            <Link 
              href="/products" 
              className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50"
            >
              產品查詢
            </Link>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {savedQuoteNo && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-600 text-4xl mb-2">✓</div>
            <h2 className="text-xl font-bold text-green-800 mb-2">報價單已儲存</h2>
            <p className="text-green-700 mb-4">報價單編號：<span className="font-mono font-bold">{savedQuoteNo}</span></p>
            <div className="flex justify-center gap-4">
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                建立新報價單
              </button>
              <Link
                href="/products"
                className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
              >
                返回產品查詢
              </Link>
            </div>
          </div>
        </div>
      )}

      {!savedQuoteNo && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h2 className="text-base font-bold text-gray-800 mb-4">客戶資訊</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">經銷商</label>
                <select
                  value={selectedDealer}
                  onChange={(e) => setSelectedDealer(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-opacity-20 outline-none"
                  style={{ borderColor: '#e5e7eb' }}
                  onFocus={(e) => { e.target.style.borderColor = '#E60012' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                >
                  <option value="">-- 選擇經銷商 --</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">報價有效天數</label>
                <input
                  type="number"
                  value={validDays}
                  onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">終端客戶名稱</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="客戶名稱"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">聯絡人</label>
                <input
                  type="text"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="聯絡人姓名"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="電話號碼"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="電子郵件"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Product Items */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-800">產品項目</h2>
              <button
                onClick={() => setShowSearch(true)}
                className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: '#E60012' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#CC0010'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#E60012'}
              >
                + 加入產品
              </button>
            </div>

            {/* Search Modal */}
            {showSearch && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">搜尋產品</h3>
                    <button onClick={() => setShowSearch(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="輸入和椿料號 / 普渡料號 / 品名..."
                    className="w-full px-4 py-3 border rounded-lg mb-4 text-sm"
                    style={{ borderColor: '#e5e7eb' }}
                    onFocus={(e) => { e.target.style.borderColor = '#E60012'; e.target.style.boxShadow = '0 0 0 3px rgba(230,0,18,0.1)' }}
                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                    autoFocus
                  />
                  <div className="max-h-80 overflow-y-auto">
                    {searching ? (
                      <p className="text-gray-500 text-center py-4">搜尋中...</p>
                    ) : searchResults.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        {searchQuery.length < 2 ? '請輸入至少 2 個字元' : '找不到產品'}
                      </p>
                    ) : (
                      searchResults.map(product => (
                        <div
                          key={product.id}
                          onClick={() => addItem(product)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-mono text-sm text-gray-600">{product.aurotek_pn}</div>
                              <div className="font-medium text-gray-800">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                {product.material_type_name} · NT$ {formatPrice(product.list_price || 0)}
                              </div>
                            </div>
                            {product.total_qty > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                庫存 {product.total_qty}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">尚未加入產品，點擊「+ 加入產品」開始</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-bold text-gray-600">產品</th>
                      <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 w-20">數量</th>
                      <th className="px-2 py-2 text-right text-xs font-bold text-gray-600 w-28">單價</th>
                      <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 w-20">折扣%</th>
                      <th className="px-2 py-2 text-right text-xs font-bold text-gray-600 w-28">小計</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-2 py-3">
                          <div className="font-mono text-xs text-gray-500">{item.product.aurotek_pn}</div>
                          <div className="text-sm font-medium text-gray-800">{item.product.name}</div>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border rounded text-right text-sm"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                          />
                        </td>
                        <td className="px-2 py-2 text-right font-medium text-gray-800">
                          {formatPrice(calculateSubtotal(item))}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700 text-lg"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total */}
            {items.length > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-gray-600">共 {items.length} 項產品</span>
                <span className="text-xl font-bold" style={{ color: '#E60012' }}>
                  總計：NT$ {formatPrice(total)}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h2 className="text-base font-bold text-gray-800 mb-4">備註</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="付款條件、交貨方式、特殊需求等..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link
              href="/products"
              className="px-6 py-2.5 border rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              取消
            </Link>
            <button
              onClick={saveQuotation}
              disabled={saving || items.length === 0}
              className="px-6 py-2.5 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#E60012' }}
              onMouseOver={(e) => !saving && (e.currentTarget.style.backgroundColor = '#CC0010')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E60012')}
            >
              {saving ? '儲存中...' : '儲存報價單'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
