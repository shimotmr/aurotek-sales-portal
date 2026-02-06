'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Product {
  id: number
  aurotek_pn: string
  pudu_pn: string | null
  name: string
  name_en: string | null
  spec: string | null
  pudu_spec: string | null
  material_type: string | null
  material_type_name: string | null
  list_price: number | null
  is_sellable: boolean
  image_url: string | null
  component_qty: number
  robot_qty: number
  total_qty: number
  product_types: string[] | null
  product_tags: string[] | null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // 篩選狀態
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string | null>(null)
  const [productTypeFilters, setProductTypeFilters] = useState<string[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  
  // 篩選選項（從資料庫載入）
  const [productTypeOptions, setProductTypeOptions] = useState<string[]>([])
  const [tagOptions, setTagOptions] = useState<string[]>([])
  
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 物料類型對應
  const materialTypes = [
    { code: 'spare', name: '備件' },
    { code: 'machine', name: '整機' },
    { code: 'service', name: '服務' },
    { code: 'consumable', name: '耗材' },
    { code: 'accessory', name: '配件' },
  ]

  // 載入篩選選項
  useEffect(() => {
    // 載入產品類型
    supabase.from('product_types').select('name').order('name')
      .then(({ data }) => {
        if (data) setProductTypeOptions(data.map(d => d.name))
      })
    
    // 載入產品標籤
    supabase.from('product_tags').select('name').order('name')
      .then(({ data }) => {
        if (data) setTagOptions(data.map(d => d.name))
      })
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      // 使用 products_full 視圖
      let query = supabase
        .from('products_full')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('aurotek_pn')

      // 關鍵字搜尋
      if (search) {
        query = query.or(`aurotek_pn.ilike.%${search}%,name.ilike.%${search}%,spec.ilike.%${search}%,pudu_pn.ilike.%${search}%`)
      }
      
      // 物料類型篩選
      if (materialTypeFilter) {
        query = query.eq('material_type', materialTypeFilter)
      }
      
      // 產品類型篩選（多選，使用 overlaps）
      if (productTypeFilters.length > 0) {
        query = query.overlaps('product_types', productTypeFilters)
      }
      
      // 產品標籤篩選（多選，使用 overlaps）
      if (tagFilters.length > 0) {
        query = query.overlaps('product_tags', tagFilters)
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
  }, [search, materialTypeFilter, productTypeFilters, tagFilters, page, pageSize])

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
    setMaterialTypeFilter(null)
    setProductTypeFilters([])
    setTagFilters([])
    setPage(1)
  }

  const toggleProductType = (type: string) => {
    setProductTypeFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
    setPage(1)
  }

  const toggleTag = (tag: string) => {
    setTagFilters(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
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
          {(materialTypeFilter || productTypeFilters.length > 0 || tagFilters.length > 0) && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
              {(materialTypeFilter ? 1 : 0) + productTypeFilters.length + tagFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Layout */}
      <main className={`grid gap-3 sm:gap-4 px-3 sm:px-4 pb-4 transition-all duration-200 ${showFilters ? 'md:grid-cols-[320px_1fr]' : 'grid-cols-1'}`}>
        
        {/* Left Sidebar - Filters */}
        {showFilters && (
          <aside className="space-y-3 md:max-h-[calc(100vh-140px)] md:overflow-y-auto">
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
                {materialTypes.map(type => (
                  <button
                    key={type.code}
                    onClick={() => { 
                      setMaterialTypeFilter(materialTypeFilter === type.code ? null : type.code)
                      setPage(1)
                    }}
                    className={`px-3 py-2 rounded-full border text-xs font-medium transition-all ${
                      materialTypeFilter === type.code 
                        ? 'text-white' 
                        : 'bg-gray-50 text-gray-700 hover:border-[#E60012]'
                    }`}
                    style={{
                      backgroundColor: materialTypeFilter === type.code ? '#E60012' : undefined,
                      borderColor: materialTypeFilter === type.code ? '#E60012' : '#e5e7eb',
                    }}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Type (Multi Select) */}
            <div className="bg-white border rounded-xl p-3 shadow-sm">
              <div className="font-bold mb-2 text-sm text-gray-800">快速篩選｜產品類型（和椿，多選）</div>
              <div className="flex flex-wrap gap-2">
                {productTypeOptions.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleProductType(type)}
                    className={`px-3 py-2 rounded-full border text-xs font-medium transition-all ${
                      productTypeFilters.includes(type)
                        ? 'text-white' 
                        : 'bg-gray-50 text-gray-700 hover:border-[#E60012]'
                    }`}
                    style={{
                      backgroundColor: productTypeFilters.includes(type) ? '#E60012' : undefined,
                      borderColor: productTypeFilters.includes(type) ? '#E60012' : '#e5e7eb',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Tags (Multi Select) */}
            <div className="bg-white border rounded-xl p-3 shadow-sm">
              <div className="font-bold mb-2 text-sm text-gray-800">快速篩選｜產品標籤（多選）</div>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-2 rounded-full border text-xs font-medium transition-all ${
                      tagFilters.includes(tag)
                        ? 'text-white' 
                        : 'bg-gray-50 text-gray-700 hover:border-[#E60012]'
                    }`}
                    style={{
                      backgroundColor: tagFilters.includes(tag) ? '#E60012' : undefined,
                      borderColor: tagFilters.includes(tag) ? '#E60012' : '#e5e7eb',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Size & Actions */}
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
                <option value={200}>200</option>
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
                  <th className="border-b p-2.5 text-left font-bold text-gray-800 text-xs whitespace-nowrap hidden lg:table-cell">產品類型</th>
                  <th className="border-b p-2.5 text-right font-bold text-gray-800 text-xs whitespace-nowrap">牌價</th>
                  <th className="border-b p-2.5 text-right font-bold text-gray-800 text-xs whitespace-nowrap hidden lg:table-cell">庫存</th>
                  <th className="border-b p-2.5 text-center font-bold text-gray-800 text-xs whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">載入中...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">找不到產品</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border-b p-2.5 text-sm font-mono text-gray-700 whitespace-nowrap">{product.aurotek_pn}</td>
                      <td className="border-b p-2.5 text-sm text-gray-700">{product.name}</td>
                      <td className="border-b p-2.5 text-sm text-gray-500 hidden md:table-cell max-w-xs truncate">{product.spec}</td>
                      <td className="border-b p-2.5 text-sm text-gray-700 whitespace-nowrap">{product.material_type_name || '-'}</td>
                      <td className="border-b p-2.5 text-sm text-gray-500 hidden lg:table-cell whitespace-nowrap">
                        {product.product_types?.join(', ') || '-'}
                      </td>
                      <td className="border-b p-2.5 text-sm text-gray-700 text-right whitespace-nowrap">
                        {formatPrice(product.list_price)}
                      </td>
                      <td className="border-b p-2.5 text-sm text-right whitespace-nowrap hidden lg:table-cell">
                        {product.total_qty > 0 ? (
                          <span className="text-green-600 font-medium">{product.total_qty}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
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
                  ))
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
                <>
                  {/* 產品圖片 */}
                  {selectedProduct.image_url && (
                    <div className="mb-4">
                      <img 
                        src={selectedProduct.image_url} 
                        alt={selectedProduct.name}
                        className="max-w-full h-auto rounded-lg border"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                  
                  <table className="w-full border-collapse">
                    <tbody>
                      {[
                        ['和椿料號', selectedProduct.aurotek_pn],
                        ['普渡料號', selectedProduct.pudu_pn],
                        ['品名', selectedProduct.name],
                        ['英文名稱', selectedProduct.name_en],
                        ['規格', selectedProduct.spec],
                        ['普渡規格', selectedProduct.pudu_spec],
                        ['物料類型', selectedProduct.material_type_name],
                        ['產品類型', selectedProduct.product_types?.join(', ')],
                        ['產品標籤', selectedProduct.product_tags?.join(', ')],
                        ['牌價', formatPrice(selectedProduct.list_price)],
                        ['是否可售', selectedProduct.is_sellable ? '✓ 是' : '✗ 否'],
                        ['組件庫存', selectedProduct.component_qty],
                        ['機器人庫存', selectedProduct.robot_qty],
                        ['庫存總數', selectedProduct.total_qty],
                      ].map(([label, value]) => (
                        <tr key={label as string}>
                          <th className="w-[35%] bg-gray-50 border-b p-2 text-left font-semibold text-gray-800 text-sm">{label}</th>
                          <td className="border-b p-2 text-sm text-gray-700">{value || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
