'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

import { supabase } from '@/lib/supabase'

// 表格只需要的欄位（輕量）
interface ProductListItem {
  id: number
  aurotek_pn: string
  name: string
  spec: string | null
  material_type_name: string | null
  product_types: string[] | null
  list_price: number | null
  dealer_price: number | null
  total_qty: number
}

// 詳細頁完整欄位
interface ProductDetail extends ProductListItem {
  pudu_pn: string | null
  name_en: string | null
  pudu_spec: string | null
  material_type: string | null
  is_sellable: boolean
  image_url: string | null
  component_qty: number
  robot_qty: number
  product_tags: string[] | null
  category_code: string | null
  material_name: string | null
  length: number | null
  width: number | null
  height: number | null
  volume: number | null
  dimension_unit: string | null
  gross_weight: number | null
  net_weight: number | null
  pudu_product_type: string | null
  warranty_period: string | null
  warranty_type: string | null
  warranty_status: string | null
  certifications: string | null
  cost_usd: number | null
  cost_ntd: number | null
  total_cost_ntd: number | null
  sales_price: number | null
  dept_price: number | null
  div_price: number | null
  dealer_price: number | null
  market_floor_price: number | null
}

// 骨架屏組件
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="border-b border-surface-3 p-2"><div className="h-4 bg-surface-2 rounded w-20" /></td>
          <td className="border-b border-surface-3 p-2"><div className="h-4 bg-surface-2 rounded w-28" /></td>
          <td className="border-b border-surface-3 p-2 hidden lg:table-cell"><div className="h-4 bg-surface-2 rounded w-24" /></td>
          <td className="border-b border-surface-3 p-2 hidden md:table-cell"><div className="h-4 bg-surface-2 rounded w-12" /></td>
          <td className="border-b border-surface-3 p-2"><div className="h-4 bg-surface-2 rounded w-16 ml-auto" /></td>
          <td className="border-b border-surface-3 p-2"><div className="h-4 bg-surface-2 rounded w-16 ml-auto" /></td>
          <td className="border-b border-surface-3 p-2 hidden sm:table-cell"><div className="h-4 bg-surface-2 rounded w-8 ml-auto" /></td>
          <td className="border-b border-surface-3 p-2"><div className="h-4 bg-surface-2 rounded w-4 mx-auto" /></td>
        </tr>
      ))}
    </>
  )
}

// 手機版卡片骨架
function CardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-1 border border-surface-3 rounded-2xl px-3 py-2.5 animate-pulse">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-3 bg-surface-2 rounded w-20" />
            <div className="h-3 bg-surface-2 rounded w-10" />
          </div>
          <div className="h-4 bg-surface-2 rounded w-3/4 mb-1.5" />
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <div className="h-4 bg-surface-2 rounded w-16" />
              <div className="h-4 bg-surface-2 rounded w-20" />
            </div>
            <div className="h-5 bg-surface-2 rounded w-12" />
          </div>
        </div>
      ))}
    </>
  )
}

// 詳細頁 Tab 組件
function DetailTabs({ product, formatPrice }: { product: ProductDetail; formatPrice: (p: number | null) => string }) {
  const [activeTab, setActiveTab] = useState<'basic' | 'spec' | 'price' | 'stock'>('basic')

  const tabs = [
    { key: 'basic', label: '基本' },
    { key: 'spec', label: '規格' },
    { key: 'price', label: '價格' },
    { key: 'stock', label: '庫存' },
  ] as const

  const renderContent = () => {
    switch (activeTab) {
      case 'basic':
        return [
          ['和椿料號', product.aurotek_pn],
          ['主分群碼', product.category_code],
          ['品名', product.name],
          ['英文名稱', product.name_en],
          ['規格', product.spec],
          ['普渡料號', product.pudu_pn],
          ['普渡規格', product.pudu_spec],
          ['物料類型', product.material_type_name],
          ['物料名稱', product.material_name],
          ['產品類型(普渡)', product.pudu_product_type],
          ['產品類型(和椿)', product.product_types?.join(', ')],
          ['產品標籤', product.product_tags?.join(', ')],
          ['是否可售', product.is_sellable ? '✓ 是' : '✗ 否'],
        ]
      case 'spec':
        return [
          ['長', product.length ? `${product.length} ${product.dimension_unit || ''}` : null],
          ['寬', product.width ? `${product.width} ${product.dimension_unit || ''}` : null],
          ['高', product.height ? `${product.height} ${product.dimension_unit || ''}` : null],
          ['體積', product.volume],
          ['尺寸單位', product.dimension_unit],
          ['毛重', product.gross_weight ? `${product.gross_weight} kg` : null],
          ['淨重', product.net_weight ? `${product.net_weight} kg` : null],
          ['保固期', product.warranty_period],
          ['保固類型', product.warranty_type],
          ['保固狀態', product.warranty_status],
          ['認證資料', product.certifications],
        ]
      case 'price':
        return [
          ['牌價', formatPrice(product.list_price)],
          ['進貨價格(USD)', product.cost_usd ? `$${product.cost_usd}` : null],
          ['進貨價格(NTD)', formatPrice(product.cost_ntd)],
          ['成本(NTD)', formatPrice(product.total_cost_ntd)],
          ['業務價格', formatPrice(product.sales_price)],
          ['部級價格', formatPrice(product.dept_price)],
          ['處級價格', formatPrice(product.div_price)],
          ['經銷商價格', formatPrice(product.dealer_price)],
          ['市場参考底線價', formatPrice(product.market_floor_price)],
        ]
      case 'stock':
        return [
          ['組件庫存', product.component_qty],
          ['機器人庫存', product.robot_qty],
          ['庫存總數', product.total_qty],
        ]
    }
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b border-surface-3 mb-4 -mx-4 px-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <table className="w-full border-collapse">
        <tbody>
          {renderContent().map(([label, value]) => (
            <tr key={label as string}>
              <th className="w-[40%] bg-surface-2 border-b border-surface-3 p-2.5 text-left font-medium text-text-primary text-sm">{label}</th>
              <td className="border-b border-surface-3 p-2.5 text-sm text-text-primary">{value !== null && value !== undefined && value !== '' ? value : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // 篩選狀態
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string | null>(null)
  const [productTypeFilters, setProductTypeFilters] = useState<string[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  
  // 篩選選項
  const [productTypeOptions, setProductTypeOptions] = useState<string[]>([])
  const [tagOptions, setTagOptions] = useState<string[]>([])
  
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(true)
  
  // 詳細頁狀態
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  
  // 響應式狀態
  const [isMobile, setIsMobile] = useState(false)

  const materialTypes = [
    { code: 'spare', name: '備件' },
    { code: 'machine', name: '整機' },
    { code: 'service', name: '服務' },
    { code: 'consumable', name: '耗材' },
    { code: 'accessory', name: '配件' },
  ]

  // 載入篩選選項
  useEffect(() => {
    supabase.from('product_types').select('name').order('name')
      .then(({ data }) => { if (data) setProductTypeOptions(data.map(d => d.name)) })
    supabase.from('product_tags').select('name').order('name')
      .then(({ data }) => { if (data) setTagOptions(data.map(d => d.name)) })
  }, [])

  // 響應式偵測
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setShowFilters(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ✅ P0 優化：只載入表格需要的欄位
  const TABLE_FIELDS = 'id,aurotek_pn,name,spec,material_type_name,product_types,list_price,dealer_price,total_qty'

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products_full')
        .select(TABLE_FIELDS, { count: 'exact' })
        .eq('is_active', true)
        .order('aurotek_pn')

      if (search) {
        query = query.or(`aurotek_pn.ilike.%${search}%,name.ilike.%${search}%,spec.ilike.%${search}%,pudu_pn.ilike.%${search}%`)
      }
      if (materialTypeFilter) {
        query = query.eq('material_type', materialTypeFilter)
      }
      if (productTypeFilters.length > 0) {
        query = query.overlaps('product_types', productTypeFilters)
      }
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

  // ✅ P0 優化：點擊詳細時才載入完整資料
  const openDrawer = async (productId: number) => {
    setDrawerOpen(true)
    setLoadingDetail(true)
    try {
      const { data, error } = await supabase
        .from('products_full')
        .select('*')
        .eq('id', productId)
        .single()
      if (error) throw error
      setSelectedProduct(data)
    } catch (err) {
      console.error('Error fetching product detail:', err)
    } finally {
      setLoadingDetail(false)
    }
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
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
    setPage(1)
  }

  const toggleTag = (tag: string) => {
    setTagFilters(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
    setPage(1)
  }

  const activeFilterCount = (materialTypeFilter ? 1 : 0) + productTypeFilters.length + tagFilters.length

  return (
    <div className="min-h-screen bg-surface-0 transition-colors duration-200">
      {/* Page Header - hidden when drawer is open on mobile */}
      <header className={`bg-surface-1/80 backdrop-blur-sm border-b border-surface-3 sticky top-0 md:top-0 z-20 transition-colors duration-200 ${drawerOpen ? 'hidden sm:block' : ''}`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center text-white shadow-lg">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/></svg>
            </div>
            <span className="font-bold text-text-primary text-sm sm:text-base">產品目錄</span>
          </div>
        </div>
      </header>

      {/* Search Bar (Mobile) */}
      {isMobile && (
        <div className="px-3 pt-3">
          <div className="flex gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="搜尋料號、品名..."
              className="flex-1 p-3 text-sm bg-surface-1 border border-surface-3 rounded-2xl focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 outline-none transition-all"
            />
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-2xl border font-medium text-sm transition-colors ${
                activeFilterCount > 0 ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-surface-1 border-surface-3'
              }`}
            >
              篩選{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
          </div>
        </div>
      )}

      {/* Toggle Filter Button (Desktop) */}
      {!isMobile && (
        <div className="px-3 sm:px-4 mt-3 mb-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-surface-3 rounded-lg font-medium text-xs transition-colors bg-surface-1 hover:bg-surface-hover"
          >
            <span>☰</span> 
            <span>展開/收起篩選</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Main Layout */}
      <main className={`grid gap-3 sm:gap-4 px-3 sm:px-4 pb-4 pt-2 transition-all duration-200 ${
        showFilters && !isMobile ? 'md:grid-cols-[320px_1fr]' : 'grid-cols-1'
      }`}>
        
        {/* Filters Sidebar / Mobile Sheet */}
        {showFilters && (
          <aside className={`space-y-3 ${isMobile ? 'bg-surface-1 rounded-2xl p-4 border border-surface-3 shadow-lg' : 'md:max-h-[calc(100vh-140px)] md:overflow-y-auto'}`}>
            {/* Keyword (Desktop only) */}
            {!isMobile && (
              <div className="bg-surface-1 border border-surface-3 rounded-2xl p-3 shadow-lg">
                <div className="font-bold mb-2 text-sm text-text-primary">關鍵字</div>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="和椿料號 / 普渡料號 / 品名 / 規格..."
                  className="w-full p-3 text-sm bg-surface-0 border border-surface-3 rounded-lg text-text-primary focus:bg-surface-0 focus:border-primary-400 outline-none transition-all"
                />
              </div>
            )}

            {/* Material Type */}
            <div className={isMobile ? '' : 'bg-surface-1 border border-surface-3 rounded-2xl p-3 shadow-lg'}>
              <div className="font-bold mb-2 text-sm text-text-primary">物料類型（單選）</div>
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
                        ? 'text-white bg-primary-500 border-primary-500' 
                        : 'bg-surface-2 text-text-secondary hover:border-primary-400'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Type - 分組顯示 */}
            <div className={isMobile ? '' : 'bg-surface-1 border border-surface-3 rounded-2xl p-3 shadow-lg'}>
              <div className="font-bold mb-2 text-sm text-text-primary">產品類型（多選）</div>
              <div className="space-y-2">
                {(() => {
                  // 定義分組規則
                  const groupRules: { prefix: string; match: (t: string) => boolean }[] = [
                    { prefix: 'CC1', match: t => t.startsWith('CC1') },
                    { prefix: 'MT1', match: t => t.startsWith('MT1') },
                    { prefix: 'PD-T', match: t => t.startsWith('PD-T') || t.startsWith('PD-D') },
                    { prefix: 'PD', match: t => /^PD[0-9]/.test(t) },
                    { prefix: 'SH1', match: t => t.startsWith('SH1') },
                  ]
                  
                  // 分組
                  const groups: { [key: string]: string[] } = {}
                  const ungrouped: string[] = []
                  
                  productTypeOptions.forEach(type => {
                    const rule = groupRules.find(r => r.match(type))
                    if (rule) {
                      if (!groups[rule.prefix]) groups[rule.prefix] = []
                      groups[rule.prefix].push(type)
                    } else {
                      ungrouped.push(type)
                    }
                  })
                  
                  const orderedPrefixes = ['CC1', 'MT1', 'PD-T', 'PD', 'SH1']
                  
                  return (
                    <>
                      {orderedPrefixes.map(prefix => {
                        const types = groups[prefix]
                        if (!types || types.length === 0) return null
                        return (
                          <div key={prefix} className="flex items-start gap-2">
                            <span className="text-xs text-text-tertiary w-12 pt-2 shrink-0">{prefix}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {types.map(type => {
                                // 顯示簡化名稱（去掉前綴）
                                let displayName = type
                                if (type !== prefix) {
                                  displayName = type.replace(prefix, '').replace(/^[\s-]+/, '') || type
                                }
                                return (
                                  <button
                                    key={type}
                                    onClick={() => toggleProductType(type)}
                                    className={`px-2 py-1 rounded border text-xs font-medium transition-all ${
                                      productTypeFilters.includes(type)
                                        ? 'text-white bg-primary-500 border-primary-500' 
                                        : 'bg-surface-2 text-text-secondary hover:border-primary-400'
                                    }`}
                                  >
                                    {displayName}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                      {ungrouped.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-text-tertiary w-12 pt-2 shrink-0">其他</span>
                          <div className="flex flex-wrap gap-1.5">
                            {ungrouped.map(type => (
                              <button
                                key={type}
                                onClick={() => toggleProductType(type)}
                                className={`px-2 py-1 rounded border text-xs font-medium transition-all ${
                                  productTypeFilters.includes(type)
                                    ? 'text-white bg-primary-500 border-primary-500' 
                                    : 'bg-surface-2 text-text-secondary hover:border-primary-400'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Product Tags */}
            <div className={isMobile ? '' : 'bg-surface-1 border border-surface-3 rounded-2xl p-3 shadow-lg'}>
              <div className="font-bold mb-2 text-sm text-text-primary">產品標籤（多選）</div>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-2 rounded-full border text-xs font-medium transition-all ${
                      tagFilters.includes(tag)
                        ? 'text-white bg-primary-500 border-primary-500' 
                        : 'bg-surface-2 text-text-secondary hover:border-primary-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className={isMobile ? 'flex gap-2 pt-2' : 'bg-surface-1 border border-surface-3 rounded-2xl p-3 shadow-lg'}>
              {!isMobile && (
                <>
                  <div className="font-bold mb-2 text-sm text-text-primary">顯示設定</div>
                  <label className="block text-xs text-text-tertiary mb-1">每頁筆數</label>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                    className="w-full p-2 text-sm border border-surface-3 rounded-lg bg-surface-0 text-text-primary outline-none"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </>
              )}
              <button
                onClick={clearFilters}
                className={`${isMobile ? 'flex-1' : 'w-full'} px-3 py-2 border border-surface-3 rounded-lg hover:bg-surface-hover transition-colors text-sm text-text-secondary`}
              >
                清除條件
              </button>
              {isMobile && (
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-3 py-2 text-white rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 transition-colors"
                >
                  套用
                </button>
              )}
            </div>
          </aside>
        )}

        {/* Content Area */}
        <section className="min-w-0 flex flex-col">
          {/* Result Count & Pagination */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
            <span className="text-text-primary font-medium text-sm">共 {total} 筆</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-surface-3 rounded-lg hover:bg-surface-hover transition-colors text-xs disabled:opacity-50 bg-surface-1 text-text-secondary"
              >
                ‹ 上一頁
              </button>
              <span className="text-text-tertiary text-xs px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-surface-3 rounded-lg hover:bg-surface-hover transition-colors text-xs disabled:opacity-50 bg-surface-1 text-text-secondary"
              >
                下一頁 ›
              </button>
            </div>
          </div>

          {/* ✅ P0: 手機版卡片佈局 */}
          {isMobile ? (
            <div className="space-y-3">
              {loading ? (
                <CardSkeleton count={pageSize > 10 ? 10 : pageSize} />
              ) : products.length === 0 ? (
                <div className="bg-surface-1 border border-surface-3 rounded-2xl p-8 text-center text-text-tertiary">找不到產品</div>
              ) : (
                products.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-surface-1 border border-surface-3 rounded-2xl px-3 py-2.5 shadow-lg active:bg-surface-hover transition-colors"
                  >
                    {/* 第一行：料號 + 類型 + 庫存 + ...詳細 */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-text-tertiary">{product.aurotek_pn}</span>
                      {product.material_type_name && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-surface-2 text-text-secondary rounded">
                          {product.material_type_name}
                        </span>
                      )}
                      {product.total_qty > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-secondary-50 text-secondary-600 rounded">
                          庫存{product.total_qty}
                        </span>
                      )}
                      <button
                        onClick={() => openDrawer(product.id)}
                        className="ml-auto text-text-tertiary hover:text-text-primary px-1.5 py-0.5 text-sm"
                        title="詳細"
                      >
                        ...
                      </button>
                    </div>
                    
                    {/* 第二行：規格（遇到 - 或 ( 後淡化） */}
                    <div className="mb-1.5 line-clamp-1">
                      {(() => {
                        const spec = product.spec || '-'
                        const match = spec.match(/^([^-（(]+)([-（(].*)$/)
                        if (match) {
                          return (
                            <>
                              <span className="font-medium text-text-primary text-sm">{match[1]}</span>
                              <span className="text-xs text-text-tertiary">{match[2]}</span>
                            </>
                          )
                        }
                        return <span className="font-medium text-text-primary text-sm">{spec}</span>
                      })()}
                    </div>
                    
                    {/* 第三行：牌價 + 經銷價 + 加入報價 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm font-semibold text-primary-500">
                          {product.list_price ? `$${formatPrice(product.list_price)}` : '-'}
                        </span>
                        {product.dealer_price && (
                          <span className="text-xs text-text-tertiary">
                            經銷<span className="text-text-secondary font-medium">${formatPrice(product.dealer_price)}</span>
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/quotations/new?product=${product.id}`}
                        className="text-xs px-2 py-1 rounded-lg text-white font-medium bg-primary-500 hover:bg-primary-600 transition-colors"
                        title="加入報價單"
                      >
                        +報價
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* 桌面版表格 */
            <div className="flex-1 overflow-auto border border-surface-3 rounded-2xl bg-surface-1 shadow-lg">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-surface-2">
                    <th className="border-b border-surface-3 p-2 text-left font-bold text-text-primary text-xs whitespace-nowrap">料號</th>
                    <th className="border-b border-surface-3 p-2 text-left font-bold text-text-primary text-xs whitespace-nowrap">規格</th>
                    <th className="border-b border-surface-3 p-2 text-left font-bold text-text-primary text-xs whitespace-nowrap hidden lg:table-cell">品名</th>
                    <th className="border-b border-surface-3 p-2 text-left font-bold text-text-primary text-xs whitespace-nowrap hidden md:table-cell">類型</th>
                    <th className="border-b border-surface-3 p-2 text-right font-bold text-text-primary text-xs whitespace-nowrap">牌價</th>
                    <th className="border-b border-surface-3 p-2 text-right font-bold text-text-primary text-xs whitespace-nowrap">經銷價</th>
                    <th className="border-b border-surface-3 p-2 text-right font-bold text-text-primary text-xs whitespace-nowrap hidden sm:table-cell">庫存</th>
                    <th className="border-b border-surface-3 p-2 text-center font-bold text-text-primary text-xs whitespace-nowrap w-12">...</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton rows={pageSize > 15 ? 15 : pageSize} />
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-text-tertiary">找不到產品</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-surface-hover transition-colors">
                        <td className="border-b border-surface-3 p-2 text-xs font-mono text-text-tertiary whitespace-nowrap">{product.aurotek_pn}</td>
                        <td className="border-b border-surface-3 p-2 max-w-[200px] truncate" title={product.spec || ''}>
                          {(() => {
                            const spec = product.spec || '-'
                            const match = spec.match(/^([^-（(]+)([-（(].*)$/)
                            if (match) {
                              return (
                                <>
                                  <span className="text-sm text-text-primary">{match[1]}</span>
                                  <span className="text-xs text-text-tertiary">{match[2]}</span>
                                </>
                              )
                            }
                            return <span className="text-sm text-text-primary">{spec}</span>
                          })()}
                        </td>
                        <td className="border-b border-surface-3 p-2 text-xs text-text-tertiary max-w-[150px] truncate hidden lg:table-cell">{product.name.split('/')[0].trim()}</td>
                        <td className="border-b border-surface-3 p-2 text-xs text-text-tertiary whitespace-nowrap hidden md:table-cell">{product.material_type_name || '-'}</td>
                        <td className="border-b border-surface-3 p-2 text-sm text-right whitespace-nowrap font-medium text-primary-500">
                          {formatPrice(product.list_price)}
                        </td>
                        <td className="border-b border-surface-3 p-2 text-sm text-right whitespace-nowrap text-text-secondary">
                          {formatPrice(product.dealer_price)}
                        </td>
                        <td className="border-b border-surface-3 p-2 text-sm text-right whitespace-nowrap hidden sm:table-cell">
                          {product.total_qty > 0 ? (
                            <span className="text-secondary-600 font-medium">{product.total_qty}</span>
                          ) : (
                            <span className="text-text-disabled">-</span>
                          )}
                        </td>
                        <td className="border-b border-surface-3 p-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => openDrawer(product.id)}
                            className="text-text-tertiary hover:text-text-primary px-1"
                            title="詳細"
                          >
                            ...
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Pagination */}
          {isMobile && products.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-4 py-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-surface-3 rounded-lg text-sm disabled:opacity-50 bg-surface-1 text-text-secondary"
              >
                ‹ 上一頁
              </button>
              <span className="text-text-secondary text-sm">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 border border-surface-3 rounded-lg text-sm disabled:opacity-50 bg-surface-1 text-text-secondary"
              >
                下一頁 ›
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Detail Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30 transition-opacity" onClick={closeDrawer} />
          <div className={`absolute top-0 right-0 h-full w-full sm:w-[480px] max-w-full bg-surface-0 flex flex-col shadow-2xl transform transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Header - sticky so it's always visible */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-3 bg-surface-1 sticky top-0 z-10">
              <button 
                onClick={closeDrawer}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover rounded-lg transition-colors"
              >
                <span>←</span>
                <span>返回目錄</span>
              </button>
              <div className="font-bold text-sm text-text-tertiary">產品明細</div>
            </div>
            
            {/* Content */}
            <div className="p-4 overflow-auto flex-1">
              {loadingDetail ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-6 bg-surface-2 rounded w-1/2" />
                  <div className="h-4 bg-surface-2 rounded w-3/4" />
                  <div className="h-32 bg-surface-2 rounded" />
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-8 bg-surface-2 rounded" />
                    ))}
                  </div>
                </div>
              ) : selectedProduct ? (
                <>
                  {/* 產品圖片 */}
                  {selectedProduct.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-surface-3 bg-surface-2 flex items-center justify-center" style={{ maxHeight: '200px' }}>
                      <img 
                        src={`https://eznawjbgzmcnkxcisrjj.supabase.co/storage/v1/object/public/product-images/${encodeURIComponent(selectedProduct.image_url)}`}
                        alt={selectedProduct.name}
                        className="max-h-[200px] w-auto object-contain"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                  
                  {/* 標題區 */}
                  <div className="mb-4">
                    <div className="font-mono text-sm text-text-tertiary mb-1">{selectedProduct.aurotek_pn}</div>
                    <h2 className="text-lg font-bold text-text-primary">
                      {(() => {
                        const text = selectedProduct.spec || selectedProduct.name
                        const match = text.match(/^([^(（]+)([(（].+[)）])$/)
                        if (match) {
                          return (
                            <>
                              {match[1].trim()}
                              <span className="text-sm font-normal text-text-tertiary ml-1">{match[2]}</span>
                            </>
                          )
                        }
                        return text
                      })()}
                    </h2>
                    {selectedProduct.list_price && (
                      <div className="text-xl font-bold text-primary-500 mt-1">
                        NT$ {formatPrice(selectedProduct.list_price)}
                      </div>
                    )}
                  </div>

                  {/* Tabs 內容 */}
                  <DetailTabs product={selectedProduct} formatPrice={formatPrice} />
                </>
              ) : null}
            </div>

            {/* Footer Actions */}
            {selectedProduct && (
              <div className="p-4 border-t border-surface-3 bg-surface-1">
                <Link
                  href={`/quotations/new?product=${selectedProduct.id}`}
                  className="block w-full px-4 py-3 text-white rounded-lg text-center font-medium bg-primary-500 hover:bg-primary-600 transition-colors"
                >
                  加入報價單
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
