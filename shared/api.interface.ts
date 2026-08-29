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

export interface ProductUpdateInput extends Partial<ProductCreateInput> {
  id: string;
}

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

export interface CategoryFieldConfig {
  key: keyof Product;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'image' | 'images' | 'videos';
}

export const WATER_PURIFIER_FIELDS: CategoryFieldConfig[] = [
  { key: 'brand', label: '品牌', type: 'string' },
  { key: 'name', label: '名称', type: 'string' },
  { key: 'model', label: '型号', type: 'string' },
  { key: 'whiteBgImage', label: '商品白底图', type: 'image' },
  { key: 'launchYear', label: '上架年份', type: 'string' },
  { key: 'isOnSale', label: '是否在售', type: 'boolean' },
  { key: 'dailyPrice', label: '日常价格', type: 'number' },
  { key: 'referencePrice', label: '参考价格', type: 'number' },
  { key: 'flux', label: '通量', type: 'string' },
  { key: 'waterFlowRate', label: '出水速度', type: 'string' },
  { key: 'faucet', label: '水龙头', type: 'string' },
  { key: 'dimensions', label: '尺寸', type: 'string' },
  { key: 'waterMode', label: '出水模式', type: 'string' },
  { key: 'roMembraneBrand', label: 'RO膜品牌', type: 'string' },
  { key: 'filterTotalCost', label: '滤芯总和成本', type: 'number' },
  { key: 'activatedCarbon', label: '活性炭用料', type: 'string' },
  { key: 'hasMaternityCert', label: '是否有母婴认证', type: 'boolean' },
  { key: 'hasZeroStagnantWater', label: '是否有0陈水', type: 'boolean' },
  { key: 'realImages', label: '产品实拍图', type: 'images' },
  { key: 'realVideos', label: '产品实拍视频', type: 'videos' },
];

export const PIPELINE_MACHINE_FIELDS: CategoryFieldConfig[] = [
  { key: 'brand', label: '品牌', type: 'string' },
  { key: 'model', label: '型号', type: 'string' },
  { key: 'whiteBgImage', label: '白底图', type: 'image' },
  { key: 'dimensions', label: '尺寸（长*宽*高）', type: 'string' },
  { key: 'heatingElement', label: '加热体', type: 'string' },
  { key: 'heatingCapacity', label: '制热能力', type: 'string' },
  { key: 'referencePrice', label: '参考价格', type: 'number' },
  { key: 'tempControl', label: '控温控量', type: 'string' },
  { key: 'hasWaterTank', label: '有无水箱', type: 'boolean' },
  { key: 'realImages', label: '实拍图', type: 'images' },
  { key: 'realVideos', label: '实拍视频', type: 'videos' },
];

export const PRE_FILTER_FIELDS: CategoryFieldConfig[] = [
  { key: 'brand', label: '品牌', type: 'string' },
  { key: 'model', label: '型号', type: 'string' },
  { key: 'whiteBgImage', label: '白底图', type: 'image' },
  { key: 'referencePrice', label: '参考价格', type: 'number' },
  { key: 'dimensions', label: '尺寸（长*宽*高）', type: 'string' },
  { key: 'flux', label: '通量', type: 'string' },
  { key: 'isAutomatic', label: '是否全自动', type: 'boolean' },
  { key: 'realImages', label: '实拍图', type: 'images' },
  { key: 'realVideos', label: '实拍视频', type: 'videos' },
];

export const CATEGORY_FIELDS: Record<ProductCategory, CategoryFieldConfig[]> = {
  water_purifier: WATER_PURIFIER_FIELDS,
  pipeline_machine: PIPELINE_MACHINE_FIELDS,
  pre_filter: PRE_FILTER_FIELDS,
  big_white_bottle: [
    { key: 'brand', label: '品牌', type: 'string' },
    { key: 'name', label: '名称', type: 'string' },
    { key: 'model', label: '型号', type: 'string' },
    { key: 'whiteBgImage', label: '白底图', type: 'image' },
    { key: 'referencePrice', label: '参考价格', type: 'number' },
    { key: 'realImages', label: '实拍图', type: 'images' },
    { key: 'realVideos', label: '实拍视频', type: 'videos' },
  ],
  central_purifier: [
    { key: 'brand', label: '品牌', type: 'string' },
    { key: 'name', label: '名称', type: 'string' },
    { key: 'model', label: '型号', type: 'string' },
    { key: 'whiteBgImage', label: '白底图', type: 'image' },
    { key: 'referencePrice', label: '参考价格', type: 'number' },
    { key: 'realImages', label: '实拍图', type: 'images' },
    { key: 'realVideos', label: '实拍视频', type: 'videos' },
  ],
  central_softener: [
    { key: 'brand', label: '品牌', type: 'string' },
    { key: 'name', label: '名称', type: 'string' },
    { key: 'model', label: '型号', type: 'string' },
    { key: 'whiteBgImage', label: '白底图', type: 'image' },
    { key: 'referencePrice', label: '参考价格', type: 'number' },
    { key: 'realImages', label: '实拍图', type: 'images' },
    { key: 'realVideos', label: '实拍视频', type: 'videos' },
  ],
};

export interface ParamGroupConfig {
  key: string;
  label: string;
  fields: string[];
}

export const WATER_PURIFIER_PARAM_GROUPS: ParamGroupConfig[] = [
  {
    key: 'basic',
    label: '基础信息',
    fields: ['brand', 'name', 'model', 'launchYear', 'isOnSale'],
  },
  {
    key: 'price',
    label: '价格信息',
    fields: ['dailyPrice', 'referencePrice'],
  },
  {
    key: 'core',
    label: '核心参数',
    fields: ['flux', 'waterFlowRate', 'faucet', 'waterMode', 'roMembraneBrand', 'dimensions'],
  },
  {
    key: 'filter',
    label: '滤芯耗材',
    fields: ['filterTotalCost', 'activatedCarbon'],
  },
  {
    key: 'cert',
    label: '认证与功能',
    fields: ['hasMaternityCert', 'hasZeroStagnantWater'],
  },
];

export const PIPELINE_MACHINE_PARAM_GROUPS: ParamGroupConfig[] = [
  { key: 'basic', label: '基础信息', fields: ['brand', 'model', 'dimensions'] },
  { key: 'price', label: '价格信息', fields: ['referencePrice'] },
  { key: 'core', label: '核心参数', fields: ['heatingElement', 'heatingCapacity', 'tempControl', 'hasWaterTank'] },
];

export const PRE_FILTER_PARAM_GROUPS: ParamGroupConfig[] = [
  { key: 'basic', label: '基础信息', fields: ['brand', 'model', 'dimensions'] },
  { key: 'price', label: '价格信息', fields: ['referencePrice'] },
  { key: 'core', label: '核心参数', fields: ['flux', 'isAutomatic'] },
];

const DEFAULT_PARAM_GROUPS: ParamGroupConfig[] = [
  { key: 'basic', label: '基础信息', fields: ['brand', 'name', 'model'] },
  { key: 'price', label: '价格信息', fields: ['referencePrice'] },
];

export const CATEGORY_PARAM_GROUPS: Record<ProductCategory, ParamGroupConfig[]> = {
  water_purifier: WATER_PURIFIER_PARAM_GROUPS,
  pipeline_machine: PIPELINE_MACHINE_PARAM_GROUPS,
  pre_filter: PRE_FILTER_PARAM_GROUPS,
  big_white_bottle: DEFAULT_PARAM_GROUPS,
  central_purifier: DEFAULT_PARAM_GROUPS,
  central_softener: DEFAULT_PARAM_GROUPS,
};

export const CATEGORY_EXCEL_COLUMN_MAP: Record<ProductCategory, Record<string, string>> = {
  water_purifier: {
    '品牌': 'brand',
    '名称': 'name',
    '型号': 'model',
    '商品白底图': 'whiteBgImage',
    '上架年份': 'launchYear',
    '是否在售': 'isOnSale',
    '日常价格': 'dailyPrice',
    '参考价格': 'referencePrice',
    '通量': 'flux',
    '出水速度': 'waterFlowRate',
    '水龙头': 'faucet',
    '尺寸': 'dimensions',
    '出水模式': 'waterMode',
    'RO膜品牌': 'roMembraneBrand',
    '滤芯总和成本': 'filterTotalCost',
    '活性炭用料': 'activatedCarbon',
    '是否有母婴认证': 'hasMaternityCert',
    '是否有0陈水': 'hasZeroStagnantWater',
    '产品实拍图': 'realImages',
    '产品实拍视频': 'realVideos',
  },
  pipeline_machine: {
    '品牌': 'brand',
    '型号': 'model',
    '白底图': 'whiteBgImage',
    '尺寸': 'dimensions',
    '加热体': 'heatingElement',
    '制热能力': 'heatingCapacity',
    '参考价格': 'referencePrice',
    '控温控量': 'tempControl',
    '有无水箱': 'hasWaterTank',
    '实拍图': 'realImages',
    '实拍视频': 'realVideos',
  },
  pre_filter: {
    '品牌': 'brand',
    '型号': 'model',
    '白底图': 'whiteBgImage',
    '参考价格': 'referencePrice',
    '尺寸': 'dimensions',
    '通量': 'flux',
    '是否全自动': 'isAutomatic',
    '实拍图': 'realImages',
    '实拍视频': 'realVideos',
  },
  big_white_bottle: {
    '品牌': 'brand',
    '名称': 'name',
    '型号': 'model',
    '白底图': 'whiteBgImage',
    '参考价格': 'referencePrice',
  },
  central_purifier: {
    '品牌': 'brand',
    '名称': 'name',
    '型号': 'model',
    '白底图': 'whiteBgImage',
    '参考价格': 'referencePrice',
  },
  central_softener: {
    '品牌': 'brand',
    '名称': 'name',
    '型号': 'model',
    '白底图': 'whiteBgImage',
    '参考价格': 'referencePrice',
  },
};
