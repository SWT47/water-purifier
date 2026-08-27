import {
  CATEGORY_LABELS,
  CATEGORY_FIELDS,
  CATEGORY_EXCEL_COLUMN_MAP,
  type ProductCategory,
  type CategoryFieldConfig,
} from '@/types';

export { CATEGORY_LABELS, CATEGORY_FIELDS, CATEGORY_EXCEL_COLUMN_MAP };
export type { ProductCategory, CategoryFieldConfig };

export const ALL_CATEGORIES: ProductCategory[] = [
  'water_purifier',
  'pipeline_machine',
  'pre_filter',
  'big_white_bottle',
  'central_purifier',
  'central_softener',
];

export const PRODUCT_CATEGORIES: Array<{
  key: ProductCategory;
  label: string;
  icon: string;
  fields: string[];
}> = ALL_CATEGORIES.map((cat: ProductCategory) => ({
  key: cat,
  label: CATEGORY_LABELS[cat],
  icon: cat === 'water_purifier' ? 'Droplets'
    : cat === 'pipeline_machine' ? 'Thermometer'
    : cat === 'pre_filter' ? 'Filter'
    : cat === 'big_white_bottle' ? 'Package'
    : cat === 'central_purifier' ? 'Droplet'
    : 'Waves',
  fields: CATEGORY_FIELDS[cat].map((f: CategoryFieldConfig) => String(f.key)),
}));

export const PRICE_KEYS = new Set(['dailyPrice', 'referencePrice', 'filterTotalCost']);
