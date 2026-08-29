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

export interface CoreParamDef {
  key: string
  label: string
  format?: (value: unknown) => string
}

function fmtBool(v: unknown): string {
  return v === true || v === 'true' || v === 1 ? '支持' : '不支持'
}

function fmtPrice(v: unknown): string {
  const n = Number(v)
  if (isNaN(n)) return String(v ?? '-')
  return `¥${n.toLocaleString('zh-CN')}/年`
}

export const CORE_PARAMS: Record<ProductCategory, CoreParamDef[]> = {
  water_purifier: [
    { key: 'flux', label: '通量' },
    { key: 'waterFlowRate', label: '出水速度' },
    { key: 'roMembraneBrand', label: 'RO膜品牌' },
    { key: 'filterTotalCost', label: '滤芯年成本', format: fmtPrice },
    { key: 'hasZeroStagnantWater', label: '0陈水', format: fmtBool },
  ],
  pipeline_machine: [
    { key: 'heatingCapacity', label: '制热能力' },
    { key: 'tempControl', label: '控温方式' },
    { key: 'hasWaterTank', label: '内置水箱', format: fmtBool },
  ],
  pre_filter: [
    { key: 'flux', label: '通量' },
    { key: 'isAutomatic', label: '全自动冲洗', format: fmtBool },
  ],
  big_white_bottle: [],
  central_purifier: [],
  central_softener: [],
}

export const ALL_PARAM_GROUPS: Record<string, CoreParamDef[]> = {
  '基础信息': [
    { key: 'brand', label: '品牌' },
    { key: 'model', label: '型号' },
    { key: 'launchYear', label: '上市年份' },
    { key: 'waterMode', label: '出水方式' },
    { key: 'faucet', label: '水龙头' },
  ],
  '过滤系统': [
    { key: 'roMembraneBrand', label: 'RO膜品牌' },
    { key: 'filterTotalCost', label: '滤芯年成本', format: fmtPrice },
    { key: 'activatedCarbon', label: '活性炭类型' },
    { key: 'hasZeroStagnantWater', label: '0陈水', format: fmtBool },
    { key: 'hasMaternityCert', label: '母婴认证', format: fmtBool },
  ],
  '性能参数': [
    { key: 'flux', label: '通量' },
    { key: 'waterFlowRate', label: '出水速度' },
    { key: 'heatingElement', label: '加热方式' },
    { key: 'heatingCapacity', label: '制热能力' },
    { key: 'tempControl', label: '控温方式' },
    { key: 'hasWaterTank', label: '内置水箱', format: fmtBool },
    { key: 'isAutomatic', label: '全自动冲洗', format: fmtBool },
    { key: 'dailyPrice', label: '日常价', format: v => `¥${Number(v).toLocaleString('zh-CN')}` },
  ],
  '尺寸外观': [
    { key: 'dimensions', label: '外形尺寸' },
  ],
}

export function getCategoryLabel(value: ProductCategory | string): string {
  return CATEGORY_LABEL_MAP[value as ProductCategory] || value
}

export function formatProductValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '-'
  if (typeof value === 'boolean') return value ? '支持' : '不支持'
  if (typeof value === 'number') return value.toLocaleString('zh-CN')
  return String(value)
}
