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
  dailyPrice: string | null;
  referencePrice: string | null;
  flux: string | null;
  waterFlowRate: string | null;
  faucet: string | null;
  dimensions: string | null;
  waterMode: string | null;
  roMembraneBrand: string | null;
  filterTotalCost: string | null;
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
  category?: string;
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
  dailyPrice?: string | number | null;
  referencePrice?: string | number | null;
  flux?: string | null;
  waterFlowRate?: string | null;
  faucet?: string | null;
  dimensions?: string | null;
  waterMode?: string | null;
  roMembraneBrand?: string | null;
  filterTotalCost?: string | number | null;
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
  id?: string;
}

export interface ComboScheme {
  id: string;
  name: string;
  productIds: string[];
  livePrice: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComboSchemeCreateInput {
  name: string;
  productIds: string[];
  livePrice?: string | number | null;
}

export interface ComboSchemeUpdateInput {
  name?: string;
  productIds?: string[];
  livePrice?: string | number | null;
}
