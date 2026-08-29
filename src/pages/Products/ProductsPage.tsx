import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Product, ProductCategory } from '@/types'
import { getProducts, getBrands } from '@/api'
import FilterBar from './FilterBar'
import ProductTable from './ProductTable'
import ProductImageCard from '@/components/ProductImageCard'
import ProductDetailModal from '@/components/ProductDetailModal'

const DEFAULT_PAGE_SIZE = 12

// mock data for fallback when API not available
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    category: 'water_purifier',
    brand: '小米',
    name: '小米净水器H800G Pro 家用直饮RO反渗透',
    model: 'MR842-C',
    whiteBgImage: 'https://picsum.photos/seed/water1/600/600',
    launchYear: '2025',
    isOnSale: true,
    dailyPrice: 2799,
    referencePrice: 2499,
    flux: '800G',
    waterFlowRate: '2.15L/min',
    waterMode: '双出水',
    roMembraneBrand: '陶氏',
    filterTotalCost: 365,
    activatedCarbon: '椰壳活性炭',
    hasMaternityCert: true,
    hasZeroStagnantWater: true,
    dimensions: '430×160×410mm',
    realImages: [
      'https://picsum.photos/seed/water1a/800/800',
      'https://picsum.photos/seed/water1b/800/800',
      'https://picsum.photos/seed/water1c/800/800',
      'https://picsum.photos/seed/water1d/800/800',
    ],
    realVideos: [],
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: '2',
    category: 'water_purifier',
    brand: '美的',
    name: '美的白泽1000G Pro 净水器家用直饮',
    model: 'MRO1787D-1000G',
    whiteBgImage: 'https://picsum.photos/seed/water2/600/600',
    launchYear: '2025',
    isOnSale: true,
    dailyPrice: 3599,
    referencePrice: 3299,
    flux: '1000G',
    waterFlowRate: '2.72L/min',
    waterMode: '单出水',
    roMembraneBrand: '世韩',
    filterTotalCost: 298,
    hasZeroStagnantWater: true,
    dimensions: '440×160×430mm',
    realImages: [
      'https://picsum.photos/seed/water2a/800/800',
      'https://picsum.photos/seed/water2b/800/800',
    ],
    realVideos: ['https://picsum.photos/seed/water2v/800/450'],
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: '3',
    category: 'pipeline_machine',
    brand: 'COLMO',
    name: 'COLMO 壁挂式管线机 即热式饮水机',
    model: 'CWG-RA08',
    whiteBgImage: 'https://picsum.photos/seed/water3/600/600',
    launchYear: '2024',
    isOnSale: true,
    dailyPrice: 3299,
    referencePrice: 2999,
    heatingElement: '稀土厚膜',
    heatingCapacity: '即开即热',
    tempControl: '6档控温',
    hasWaterTank: false,
    dimensions: '370×180×520mm',
    realImages: [
      'https://picsum.photos/seed/water3a/800/800',
    ],
    realVideos: [],
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: '4',
    category: 'pre_filter',
    brand: '3M',
    name: '3M 前置过滤器 全屋自来水过滤器',
    model: 'BFS3-40BK',
    whiteBgImage: 'https://picsum.photos/seed/water4/600/600',
    launchYear: '2023',
    isOnSale: true,
    dailyPrice: 1099,
    referencePrice: 899,
    flux: '4T/h',
    isAutomatic: true,
    realImages: [],
    realVideos: [],
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '5',
    category: 'big_white_bottle',
    brand: '滨特尔',
    name: '滨特尔大白瓶 前置过滤器 全屋中央净水',
    model: 'BF-10-B',
    whiteBgImage: 'https://picsum.photos/seed/water5/600/600',
    launchYear: '2024',
    isOnSale: true,
    referencePrice: 1299,
    flux: '2T/h',
    realImages: [],
    realVideos: [],
    createdAt: '2026-01-08T00:00:00Z',
  },
  {
    id: '6',
    category: 'central_purifier',
    brand: '怡口',
    name: '怡口中央净水机 全屋净化系统',
    model: 'ETF2100PF10',
    whiteBgImage: 'https://picsum.photos/seed/water6/600/600',
    launchYear: '2025',
    isOnSale: true,
    referencePrice: 8800,
    flux: '2.5T/h',
    activatedCarbon: '椰壳活性炭+KDF',
    realImages: [],
    realVideos: [],
    createdAt: '2026-01-12T00:00:00Z',
  },
  {
    id: '7',
    category: 'central_softener',
    brand: '软水世家',
    name: '中央软水机 家用全屋软水系统',
    model: 'RS-1T',
    whiteBgImage: 'https://picsum.photos/seed/water7/600/600',
    launchYear: '2024',
    isOnSale: true,
    referencePrice: 4599,
    flux: '1T/h',
    isAutomatic: true,
    realImages: [],
    realVideos: [],
    createdAt: '2026-01-14T00:00:00Z',
  },
  {
    id: '8',
    category: 'water_purifier',
    brand: '海尔',
    name: '海尔净水器600G 家用直饮RO反渗透',
    model: 'HRO600-4A',
    whiteBgImage: 'https://picsum.photos/seed/water8/600/600',
    launchYear: '2023',
    isOnSale: true,
    dailyPrice: 2199,
    referencePrice: 1899,
    flux: '600G',
    waterFlowRate: '1.5L/min',
    roMembraneBrand: '汇通',
    filterTotalCost: 240,
    hasZeroStagnantWater: false,
    waterMode: '双出水',
    realImages: [],
    realVideos: [],
    createdAt: '2026-01-03T00:00:00Z',
  },
  {
    id: '9',
    category: 'pipeline_machine',
    brand: '美的',
    name: '美的管线机 家用壁挂式即热饮水机',
    model: 'MG908-R',
    whiteBgImage: 'https://picsum.photos/seed/water9/600/600',
    launchYear: '2025',
    isOnSale: true,
    referencePrice: 1699,
    heatingElement: '即热式',
    heatingCapacity: '3秒速热',
    tempControl: '4档控温',
    hasWaterTank: true,
    realImages: [],
    realVideos: [],
    createdAt: '2026-01-06T00:00:00Z',
  },
  {
    id: '10',
    category: 'pre_filter',
    brand: '汉斯希尔',
    name: '汉斯希尔 前置过滤器 家用全屋净水',
    model: 'WS-2314-20-003',
    whiteBgImage: 'https://picsum.photos/seed/water10/600/600',
    launchYear: '2024',
    isOnSale: true,
    referencePrice: 1599,
    flux: '3.5T/h',
    isAutomatic: false,
    realImages: [],
    realVideos: [],
    createdAt: '2026-01-07T00:00:00Z',
  },
]

const ALL_BRANDS = ['小米', '美的', 'COLMO', '3M', '滨特尔', '怡口', '海尔', '软水世家']

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlCategory = searchParams.get('cat') as ProductCategory | ''

  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)

  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<ProductCategory | ''>(urlCategory || '')
  const [brand, setBrand] = useState('')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getBrands()
        setBrands(data)
      } catch {
        setBrands(ALL_BRANDS)
      }
    }
    fetchBrands()
  }, [])

  // Sync URL param with local state
  useEffect(() => {
    if (urlCategory !== category) {
      setCategory(urlCategory || '')
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategory])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProducts({
        page,
        pageSize,
        category,
        keyword,
        brand,
      })
      setProducts(res.items)
      setTotal(res.total)
    } catch {
      // Fallback to mock data
      const all = MOCK_PRODUCTS.filter((p: Product) => {
        if (category && p.category !== category) return false
        if (brand && p.brand !== brand) return false
        if (keyword) {
          const kw = keyword.toLowerCase()
          if (
            !p.name.toLowerCase().includes(kw) &&
            !p.brand.toLowerCase().includes(kw) &&
            !(p.model || '').toLowerCase().includes(kw)
          )
            return false
        }
        return true
      })
      const start = (page - 1) * pageSize
      setProducts(all.slice(start, start + pageSize))
      setTotal(all.length)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, category, keyword, brand])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearch = () => {
    setPage(1)
  }

  const handleCategoryChange = (value: ProductCategory | '') => {
    setCategory(value)
    setPage(1)
    if (value) {
      searchParams.set('cat', value)
    } else {
      searchParams.delete('cat')
    }
    setSearchParams(searchParams)
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setDetailOpen(true)
  }

  const pageTitle = useMemo(() => {
    if (category) {
      const labels: Record<string, string> = {
        water_purifier: '净水器',
        pipeline_machine: '管线机',
        pre_filter: '前置过滤器',
        big_white_bottle: '大白瓶',
        central_purifier: '中央净水机',
        central_softener: '中央软水机',
      }
      return labels[category] || '产品列表'
    }
    return '全部产品'
  }, [category])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
        <div className="text-sm text-gray-500">
          共 <span className="font-medium text-gray-800">{total}</span> 款产品
        </div>
      </div>

      <FilterBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        category={category}
        onCategoryChange={handleCategoryChange}
        brand={brand}
        onBrandChange={setBrand}
        brands={brands}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSearch={handleSearch}
      />

      {viewMode === 'table' ? (
        <ProductTable
          products={products}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRowClick={handleViewProduct}
        />
      ) : (
        <div>
          {loading ? (
            <div className="text-center py-16 text-gray-400">加载中...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-[6px] border border-[#E5E7EB]">
              暂无匹配的产品
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product: Product) => (
                <ProductImageCard
                  key={product.id}
                  product={product}
                  onClick={() => handleViewProduct(product)}
                />
              ))}
            </div>
          )}

          {/* 卡片模式分页 */}
          {total > pageSize && (
            <div className="flex items-center justify-center gap-1 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-8 px-3 text-sm rounded-[6px] border border-[#E5E7EB] bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <span className="h-8 px-3 flex items-center text-sm text-gray-500">
                {page} / {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <button
                onClick={() =>
                  setPage(Math.min(Math.ceil(total / pageSize), page + 1))
                }
                disabled={page >= Math.ceil(total / pageSize)}
                className="h-8 px-3 text-sm rounded-[6px] border border-[#E5E7EB] bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      <ProductDetailModal
        open={detailOpen}
        product={selectedProduct}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  )
}
