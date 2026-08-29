export type ProductCategory =
  | 'water_purifier'
  | 'pipeline_machine'
  | 'pre_filter'
  | 'big_white_bottle'
  | 'central_purifier'
  | 'central_softener'

export interface ProductParams {
  [key: string]: string | number | boolean | undefined
}

export interface Product {
  id: string
  category: ProductCategory
  brand: string
  name: string
  model: string
  imageUrl: string
  referencePrice: number
  params: ProductParams
  realImages: string[]
  realVideoUrl?: string
  description?: string
  createdAt: string
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  pageSize: number
}

export interface ProductListQuery {
  page?: number
  pageSize?: number
  category?: ProductCategory | ''
  keyword?: string
  brand?: string
}

export interface ComboScheme {
  id: string
  name: string
  products: string[]
  comboPrice: number
  originalPrice: number
}

export interface TDSCityData {
  province: string
  city: string
  tds: number
}

export type TDSLevel = '极软水' | '软水' | '中等硬水' | '硬水' | '极硬水'
