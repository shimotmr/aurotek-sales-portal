'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Product {
  id: string
  sku: string
  name: string
  specification: string | null
  product_type: string
  product_pricing: { list_price: number | null }[]
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
  const [validDays, setValidDays] = useState(30)
  const [notes, setNotes] = useState('')
  
  const [items, setItems] = useState<QuoteItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load dealers
  useEffect(() => {
    supabase.from('dealers').select('id, name, contact').eq('status', 'active').order('name')
      .then(({ data }) => setDealers(data || []))
  }, [])

  // Search products
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('products')
        .select('id, sku, name, specification, product_type, product_pricing(list_price)')
        .eq('is_active', true)
        .or(`sku.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .limit(10)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addItem = (product: Product) => {
    const price = product.product_pricing?.[0]?.list_price || 0
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

      // Insert quotation
      const { data: quotation, error: qError } = await supabase
        .from('quotations')
        .insert({
          quotation_no: quotationNo,
          dealer_id: selectedDealer || null,
          customer_name: customerName,
          customer_contact: customerContact,
          status: 'draft',
          valid_until: validUntil.toISOString().split('T')[0],
          subtotal: total,
          total_amount: total,
          notes: notes
        })
        .select()
        .single()

      if (qError) throw qError

      // Insert items
      const itemsToInsert = items.map((item, index) => ({
        quotation_id: quotation.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_pct: item.discount,
        subtotal: calculateSubtotal(item),
        sort_order: index
      }))

      const { error: iError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert)

      if (iError) throw iError

      setSaved(true)
      alert(`報價單 ${quotationNo} 已儲存！`)
    } catch (err) {
      console.error('Error saving quotation:', err)
      alert('儲存失敗，請稍後再試')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">新增報價單</h1>
            <Link href="/products" className="text-blue-600 hover:underline">
              ← 產品查詢
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">客戶資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">經銷商</label>
              <select
                value={selectedDealer}
                onChange={(e) => setSelectedDealer(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- 選擇經銷商 --</option>
                {dealers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">有效天數</label>
              <input
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">終端客戶</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="客戶名稱"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">聯絡人</label>
              <input
                type="text"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="聯絡人姓名/電話"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Product Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">產品項目</h2>
            <button
              onClick={() => setShowSearch(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + 加入產品
            </button>
          </div>

          {/* Search Modal */}
          {showSearch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">搜尋產品</h3>
                  <button onClick={() => setShowSearch(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="輸入 SKU 或品名..."
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  autoFocus
                />
                <div className="max-h-64 overflow-y-auto">
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
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                      >
                        <div className="font-mono text-sm text-gray-600">{product.sku}</div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.product_type} · NT$ {formatPrice(product.product_pricing?.[0]?.list_price || 0)}
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
            <p className="text-gray-500 text-center py-8">尚未加入產品</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">產品</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-20">數量</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-28">單價</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-20">折扣%</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 w-28">小計</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-2 py-2">
                        <div className="font-mono text-xs text-gray-500">{item.product.sku}</div>
                        <div className="text-sm">{item.product.name}</div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-medium">
                        {formatPrice(calculateSubtotal(item))}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
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
            <div className="mt-4 pt-4 border-t text-right">
              <span className="text-lg font-semibold">總計：NT$ {formatPrice(total)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">備註</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="付款條件、交貨方式等..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/products"
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
          >
            取消
          </Link>
          <button
            onClick={saveQuotation}
            disabled={saving || saved || items.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '儲存中...' : saved ? '已儲存' : '儲存報價單'}
          </button>
        </div>
      </div>
    </div>
  )
}
