export type ProductCategory =
  | 'water_purifier'
  | 'pipeline_machine'
  | 'pre_filter'
  | 'big_white_bottle'
  | 'central_purifier'
  | 'central_softener'

export interface Product {
  id: string
  category: ProductCategory
  brand: string
  name: string
  model: string
  whiteBgImage: string
  launchYear?: string
  isOnSale: boolean
  dailyPrice?: number
  referencePrice?: number
  flux?: string
  waterFlowRate?: string
  faucet?: string
  dimensions?: string
  waterMode?: string
  roMembraneBrand?: string
  filterTotalCost?: number
  activatedCarbon?: string
  hasMaternityCert?: boolean
  hasZeroStagnantWater?: boolean
  realImages: string[]
  realVideos: string[]
  heatingElement?: string
  heatingCapacity?: string
  tempControl?: string
  hasWaterTank?: boolean
  isAutomatic?: boolean
  createdAt: string
  updatedAt?: string
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
  productIds: string[]
  livePrice: number
  createdAt: string
}

export interface TDSCityData {
  province: string
  city: string
  tds: number
}

export interface TDSLevelInfo {
  level: string
  color: string
  bgColor: string
  description: string
}

export type TDSLevel = '极软水' | '软水' | '中等硬水' | '硬水' | '极硬水'
