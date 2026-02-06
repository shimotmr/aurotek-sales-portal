'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Product {
  id: string
  sku: string
  vendor_sku: string | null
  product_type: string
  category_code: string | null
  brand: string | null
  name: string
  specification: string | null
  notes: string | null
  is_active: boolean
  product_pricing: {
    list_price: number | null
    floor_price: number | null
    cost_ntd: number | null
    cost_usd: number | null
    list_margin_pct: number | null
    floor_margin_pct: number | null
  }[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const productTypes = ['整機', '服務', '配件', '備件', '耗材']

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_pricing(list_price, floor_price, cost_ntd, cost_usd, list_margin_pct, floor_margin_pct)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('sku')

      if (search) {
        query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%,specification.ilike.%${search}%,vendor_sku.ilike.%${search}%`)
      }
      if (typeFilter) {
        query = query.eq('product_type', typeFilter)
      }

      query = query.range((page - 1) * pageSize, page * pageSize - 1)

      const { data, count, error } = await query

      if (error) throw error
      setProducts(data || [])
      setTotal(count || 0)
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, page, pageSize])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  const formatPrice = (price: number | null) => {
    if (!price) return '-'
    return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(price)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const openDrawer = (product: Product) => {
    setSelectedProduct(product)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedProduct(null), 300)
  }

  const clearFilters = () => {
    setSearch('')
    setTypeFilter(null)
    setPage(1)
  }

  // 響應式：手機版默認隱藏篩選
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowFilters(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-3 sm:px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-500 hover:text-gray-700 text-xl">←</Link>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">普渡料號資料庫 - 查詢</h1>
            </div>
            <Link 
              href="/quotations/new"
              className="text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#E60012' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#CC0010'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#E60012'}
            >
              + 報價單
            </Link>
          </div>
        </div>
      </div>

      {/* Toggle Filter Button */}
      <div className="px-3 sm:px-4 mt-3 mb-2">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg font-medium text-xs transition-colors bg-white hover:bg-gray-50"
        >
          <span>☰</span> 
          <span className="hidden sm:inline">展開/收起篩選</span>
          <span className="sm:hidden">篩選</span>
        </button>
      </div>

      {/* Main Layout */}
      <main className={`grid gap-3 sm:gap-4 px-3 sm:px-4 pb-4 transition-all duration-200 ${showFilters ? 'md:grid-cols-[320px_1fr]' : 'grid-cols-1'}`}>
        
        {/* Left Sidebar - Filters */}
        {showFilters && (
          <aside className="space-y-3">
            {/* Keyword */}
            <div className="bg-white border rounded-xl p-3 shadow-sm">
              <div className="font-bold mb-2 text-sm text-gray-800">關鍵字</div>
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                placeholder="和椿料號 / 普渡料號 / 品名 / 規格..."
                className="w-full p-3 text-sm bg-gray-50 rounded-lg border focus:bg-white focus:ring-2 focus:ring-opacity-20 outline-none transition-all"
                style={{ borderColor: '#e5e7eb' }}
                onFocus={(e) => { e.target.style.borderColor = '#E60012'; e.target.style.boxShadow = '0 0 0 3px rgba(230,0,18,0.1)' }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Material Type (Single Select) */}
            <div className="bg-white border rounded-xl p-3 shadow-sm">
              <div className="font-bold mb-2 text-sm text-gray-800">快速篩選｜物料類型（單選）</div>
              <div className="flex flex-wrap gap-2">
                {productTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => { 
                      setTypeFilter(typeFilter === type ? null : type)
                      setPage(1)
                    }}
                    className={`px-3 py-2 rounded-full border text-xs font-medium transition-all ${
                      typeFilter === type 
                        ? 'text-white' 
                        : 'bg-gray-50 text-gray-700 hover:border-[#E60012]'
                    }`}
                    style={{
                      backgroundColor: typeFilter === type ? '#E60012' : undefined,
                      borderColor: typeFilter === type ? '#E60012' : '#e5e7eb',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Size */}
            <div className="bg-white border rounded-xl p-3 shadow-sm">
              <div className="font-bold mb-2 text-sm text-gray-800">顯示設定</div>
              <label className="block text-xs text-gray-500 mb-1">每頁筆數</label>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="w-full p-2 text-sm border rounded-lg bg-white outline-none transition-all focus:ring-2 focus:ring-opacity-20"
                style={{ borderColor: '#e5e7eb' }}
                onFocus={(e) => { e.target.style.borderColor = '#E60012' }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <button
                onClick={fetchProducts}
                className="w-full mt-3 px-3 py-2 text-white rounded-lg font-medium text-sm transition-colors"
                style={{ backgroundColor: '#E60012' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#CC0010'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#E60012'}
              >
                查詢
              </button>
              <button
                onClick={clearFilters}
                className="w-full mt-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                清除條件
              </button>
            </div>
          </aside>
        )}

        {/* Right Content - Table */}
        <section className="min-w-0 flex flex-col">
          {/* Result Count & Pagination */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
            <span className="text-gray-700 font-medium text-sm">共 {total} 筆</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors text-xs disabled:opacity-50"
              >
                « 上一頁
              </button>
              <span className="text-gray-500 text-xs px-2">第 {page} / {totalPages} 頁</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors text-xs disabled:opacity-50"
              >
                下一頁 »
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto border rounded-xl bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100">
                  <th className="border-b p-2.5 text-left font-bold text-gray-800 text-xs whitespace-nowrap">和椿料號</th>
                  <th className="border-b p-2.5 text-left font-bold text-gray-800 text-xs whitespace-nowrap">品名</th>
                  <th className="border-b p-2.5 text-left font-bold text-gray-800 text-xs whitespace-nowrap hidden md:table-cell">規格</th>
                  <th className="border-b p-2.5 text-left font-bold text-gray-800 text-xs whitespace-nowrap">物料類型</th>
                  <th className="border-b p-2.5 text-right font-bold text-gray-800 text-xs whitespace-nowrap">牌價</th>
                  <th className="border-b p-2.5 text-center font-bold text-gray-800 text-xs whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">載入中...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">找不到產品</td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const pricing = product.product_pricing?.[0]
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="border-b p-2.5 text-sm font-mono text-gray-700 whitespace-nowrap">{product.sku}</td>
                        <td className="border-b p-2.5 text-sm text-gray-700">{product.name}</td>
                        <td className="border-b p-2.5 text-sm text-gray-500 hidden md:table-cell max-w-xs truncate">{product.specification}</td>
                        <td className="border-b p-2.5 text-sm text-gray-700 whitespace-nowrap">{product.product_type}</td>
                        <td className="border-b p-2.5 text-sm text-gray-700 text-right whitespace-nowrap">
                          {formatPrice(pricing?.list_price)}
                        </td>
                        <td className="border-b p-2.5 text-center">
                          <button
                            onClick={() => openDrawer(product)}
                            className="underline text-xs transition-colors px-2"
                            style={{ color: '#E60012' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#CC0010'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#E60012'}
                          >
                            詳細
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-30">
          {/* Mask */}
          <div 
            className="absolute inset-0 bg-black/20 transition-opacity"
            onClick={closeDrawer}
          />
          {/* Panel */}
          <div className={`absolute top-0 right-0 h-full w-full sm:w-[520px] max-w-full bg-white border-l flex flex-col shadow-xl transform transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-bold text-lg text-gray-800">明細</div>
              <button 
                onClick={closeDrawer}
                className="text-2xl hover:opacity-80 transition-opacity w-11 h-11 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {selectedProduct && (
                <table className="w-full border-collapse">
                  <tbody>
                    {[
                      ['和椿料號', selectedProduct.sku],
                      ['普渡料號', selectedProduct.vendor_sku],
                      ['品名', selectedProduct.name],
                      ['規格', selectedProduct.specification],
                      ['物料類型', selectedProduct.product_type],
                      ['分群碼', selectedProduct.category_code],
                      ['牌價', formatPrice(selectedProduct.product_pricing?.[0]?.list_price)],
                      ['市場底價', formatPrice(selectedProduct.product_pricing?.[0]?.floor_price)],
                      ['牌價毛利%', selectedProduct.product_pricing?.[0]?.list_margin_pct ? `${selectedProduct.product_pricing[0].list_margin_pct}%` : '-'],
                      ['底價毛利%', selectedProduct.product_pricing?.[0]?.floor_margin_pct ? `${selectedProduct.product_pricing[0].floor_margin_pct}%` : '-'],
                      ['進價(USD)', selectedProduct.product_pricing?.[0]?.cost_usd ? `$${selectedProduct.product_pricing[0].cost_usd}` : '-'],
                      ['進價(NTD)', formatPrice(selectedProduct.product_pricing?.[0]?.cost_ntd)],
                      ['備註', selectedProduct.notes],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <th className="w-[35%] bg-gray-50 border-b p-2 text-left font-semibold text-gray-800 text-sm">{label}</th>
                        <td className="border-b p-2 text-sm text-gray-700">{value || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
