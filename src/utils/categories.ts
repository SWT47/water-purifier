import type { ProductCategory } from '@/types'
import {
  Droplets,
  Waves,
  Filter,
  Cylinder,
  Building2,
  Shapes,
} from 'lucide-react'

export interface CategoryOption {
  value: ProductCategory | ''
  label: string
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: '', label: '全部类目' },
  { value: 'water_purifier', label: '净水器' },
  { value: 'pipeline_machine', label: '管线机' },
  { value: 'pre_filter', label: '前置过滤器' },
  { value: 'big_white_bottle', label: '大白瓶' },
  { value: 'central_purifier', label: '中央净水机' },
  { value: 'central_softener', label: '中央软水机' },
]

export const CATEGORY_LABEL_MAP: Record<ProductCategory, string> = {
  water_purifier: '净水器',
  pipeline_machine: '管线机',
  pre_filter: '前置过滤器',
  big_white_bottle: '大白瓶',
  central_purifier: '中央净水机',
  central_softener: '中央软水机',
}

export const CATEGORY_ICONS: Record<ProductCategory, typeof Droplets> = {
  water_purifier: Droplets,
  pipeline_machine: Waves,
  pre_filter: Filter,
  big_white_bottle: Cylinder,
  central_purifier: Building2,
  central_softener: Shapes,
}

export const CORE_PARAMS: Record<ProductCategory, string[]> = {
  water_purifier: ['通量', '出水速度', 'RO膜品牌', '滤芯年成本', '0陈水'],
  pipeline_machine: ['制热能力', '控温方式', '内置水箱'],
  pre_filter: ['通量', '全自动冲洗'],
  big_white_bottle: [],
  central_purifier: [],
  central_softener: [],
}

export function getCategoryLabel(value: ProductCategory | string): string {
  return CATEGORY_LABEL_MAP[value as ProductCategory] || value
}
