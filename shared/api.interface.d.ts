export type ProductCategory = 'water_purifier' | 'pipeline_machine' | 'pre_filter' | 'big_white_bottle' | 'central_purifier' | 'central_softener';
export declare const CATEGORY_LABELS: Record<ProductCategory, string>;
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
export declare const WATER_PURIFIER_FIELDS: CategoryFieldConfig[];
export declare const PIPELINE_MACHINE_FIELDS: CategoryFieldConfig[];
export declare const PRE_FILTER_FIELDS: CategoryFieldConfig[];
export declare const CATEGORY_FIELDS: Record<ProductCategory, CategoryFieldConfig[]>;
export interface ParamGroupConfig {
    key: string;
    label: string;
    fields: string[];
}
export declare const WATER_PURIFIER_PARAM_GROUPS: ParamGroupConfig[];
export declare const PIPELINE_MACHINE_PARAM_GROUPS: ParamGroupConfig[];
export declare const PRE_FILTER_PARAM_GROUPS: ParamGroupConfig[];
export declare const CATEGORY_PARAM_GROUPS: Record<ProductCategory, ParamGroupConfig[]>;
export declare const CATEGORY_EXCEL_COLUMN_MAP: Record<ProductCategory, Record<string, string>>;
