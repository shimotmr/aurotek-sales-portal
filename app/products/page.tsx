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
  is_active: boolean
  product_pricing: {
    list_price: number | null
    floor_price: number | null
    cost_ntd: number | null
  }[]
}

type SortField = 'sku' | 'name' | 'product_type' | 'list_price' | 'floor_price'
type SortOrder = 'asc' | 'desc'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [sortField, setSortField] = useState<SortField>('sku')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const pageSize = 20

  const productTypes = ['整機', '服務', '配件', '備件', '耗材']

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_pricing(list_price, floor_price, cost_ntd)
        `, { count: 'exact' })
        .eq('is_active', true)

      if (search) {
        query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%,specification.ilike.%${search}%`)
      }
      if (typeFilter) {
        query = query.eq('product_type', typeFilter)
      }

      // 排序 (價格欄位需要特殊處理)
      if (sortField === 'list_price' || sortField === 'floor_price') {
        query = query.order('sku', { ascending: sortOrder === 'asc' })
      } else {
        query = query.order(sortField, { ascending: sortOrder === 'asc' })
      }

      query = query.range(page * pageSize, (page + 1) * pageSize - 1)

      const { data, count, error } = await query

      if (error) throw error
      
      // 如果是價格排序，在前端排序
      let sortedData = data || []
      if (sortField === 'list_price' || sortField === 'floor_price') {
        sortedData = [...sortedData].sort((a, b) => {
          const aPrice = a.product_pricing?.[0]?.[sortField] || 0
          const bPrice = b.product_pricing?.[0]?.[sortField] || 0
          return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice
        })
      }
      
      setProducts(sortedData)
      setTotal(count || 0)
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, page, sortField, sortOrder])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setPage(0)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '-'
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(price)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">←</Link>
              <h1 className="text-2xl font-bold text-gray-900">產品查詢</h1>
            </div>
            <Link 
              href="/quotations/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + 新增報價單
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => { setTypeFilter(''); setPage(0) }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition
              ${!typeFilter ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            全部
          </button>
          {productTypes.map(type => (
            <button
              key={type}
              onClick={() => { setTypeFilter(type); setPage(0) }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition
                ${typeFilter === type ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <input
            type="text"
            placeholder="搜尋 SKU、品名、規格..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600 mb-2">
          共 {total} 筆結果 {search && `(搜尋: "${search}")`}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    onClick={() => handleSort('sku')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  >
                    SKU <SortIcon field="sku" />
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  >
                    品名 <SortIcon field="name" />
                  </th>
                  <th 
                    onClick={() => handleSort('product_type')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 hidden md:table-cell"
                  >
                    類型 <SortIcon field="product_type" />
                  </th>
                  <th 
                    onClick={() => handleSort('list_price')}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  >
                    牌價 <SortIcon field="list_price" />
                  </th>
                  <th 
                    onClick={() => handleSort('floor_price')}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 hidden sm:table-cell"
                  >
                    底價 <SortIcon field="floor_price" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      載入中...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      找不到產品
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const pricing = product.product_pricing?.[0]
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{product.sku}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{product.specification}</div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                            ${product.product_type === '整機' ? 'bg-blue-100 text-blue-800' :
                              product.product_type === '服務' ? 'bg-green-100 text-green-800' :
                              product.product_type === '配件' ? 'bg-yellow-100 text-yellow-800' :
                              product.product_type === '備件' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {product.product_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatPrice(pricing?.list_price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500 hidden sm:table-cell">
                          {formatPrice(pricing?.floor_price)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                上一頁
              </button>
              <span className="text-sm text-gray-600">
                第 {page + 1} / {totalPages} 頁
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                下一頁
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
