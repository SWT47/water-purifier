// 前后端共享类型定义
// 与 NestJS 项目 shared/api.interface.ts 字段保持一致

export type ProductCategory =
  | 'water_purifier'
  | 'pipeline_machine'
  | 'pre_filter'
  | 'big_white_bottle'
  | 'central_purifier'
  | 'central_softener';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  water_purifier: '净水器',
  pipeline_machine: '管线机',
  pre_filter: '前置过滤器',
  big_white_bottle: '大白瓶',
  central_purifier: '中央净水机',
  central_softener: '中央软水机',
};

export interface Product {
  id: string;
  category: ProductCategory;
  brand: string | null;
  name: string | null;
  model: string | null;
  whiteBgImage: string | null;
  launchYear: string | null;
  isOnSale: boolean;
  dailyPrice: number | null;
  referencePrice: number | null;
  flux: string | null;
  waterFlowRate: string | null;
  faucet: string | null;
  dimensions: string | null;
  waterMode: string | null;
  roMembraneBrand: string | null;
  filterTotalCost: number | null;
  activatedCarbon: string | null;
  hasMaternityCert: boolean;
  hasZeroStagnantWater: boolean;
  realImages: string[];
  realVideos: string[];
  heatingElement: string | null;
  heatingCapacity: string | null;
  tempControl: string | null;
  hasWaterTank: boolean;
  isAutomatic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  category?: ProductCategory;
  keyword?: string;
  brand?: string;
  isOnSale?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductCreateInput {
  category: ProductCategory;
  brand?: string | null;
  name?: string | null;
  model?: string | null;
  whiteBgImage?: string | null;
  launchYear?: string | null;
  isOnSale?: boolean;
  dailyPrice?: number | null;
  referencePrice?: number | null;
  flux?: string | null;
  waterFlowRate?: string | null;
  faucet?: string | null;
  dimensions?: string | null;
  waterMode?: string | null;
  roMembraneBrand?: string | null;
  filterTotalCost?: number | null;
  activatedCarbon?: string | null;
  hasMaternityCert?: boolean;
  hasZeroStagnantWater?: boolean;
  realImages?: string[];
  realVideos?: string[];
  heatingElement?: string | null;
  heatingCapacity?: string | null;
  tempControl?: string | null;
  hasWaterTank?: boolean;
  isAutomatic?: boolean;
}

export type ProductUpdateInput = Partial<ProductCreateInput>;

export interface ApiResp<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export interface ComboScheme {
  id: string;
  name: string;
  productIds: string[];
  livePrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComboSchemeCreateInput {
  name: string;
  productIds: string[];
  livePrice?: number | null;
}

export interface ComboSchemeUpdateInput {
  name?: string;
  productIds?: string[];
  livePrice?: number | null;
}

// Excel 列名→字段映射（中文表头匹配）
export const EXCEL_COLUMN_MAP: Record<string, keyof Product> = {
  '品牌': 'brand',
  '名称': 'name',
  '产品名称': 'name',
  '型号': 'model',
  '商品白底图': 'whiteBgImage',
  '白底图': 'whiteBgImage',
  '上架年份': 'launchYear',
  '年份': 'launchYear',
  '是否在售': 'isOnSale',
  '在售': 'isOnSale',
  '日常价格': 'dailyPrice',
  '日常价': 'dailyPrice',
  '参考价格': 'referencePrice',
  '参考价': 'referencePrice',
  '通量': 'flux',
  '出水速度': 'waterFlowRate',
  '水龙头': 'faucet',
  '尺寸': 'dimensions',
  '出水模式': 'waterMode',
  'RO膜品牌': 'roMembraneBrand',
  '滤芯总和成本': 'filterTotalCost',
  '滤芯成本': 'filterTotalCost',
  '活性炭用料': 'activatedCarbon',
  '活性炭': 'activatedCarbon',
  '是否有母婴认证': 'hasMaternityCert',
  '母婴认证': 'hasMaternityCert',
  '是否有0陈水': 'hasZeroStagnantWater',
  '0陈水': 'hasZeroStagnantWater',
  '产品实拍图': 'realImages',
  '实拍图': 'realImages',
  '产品实拍视频': 'realVideos',
  '实拍视频': 'realVideos',
  '加热体': 'heatingElement',
  '制热能力': 'heatingCapacity',
  '控温控量': 'tempControl',
  '有无水箱': 'hasWaterTank',
  '水箱': 'hasWaterTank',
  '是否全自动': 'isAutomatic',
  '全自动': 'isAutomatic',
};
