import React from 'react';
import {
  Info,
  DollarSign,
  Settings,
  Droplets,
  ShieldCheck,
} from 'lucide-react';
import type { Product, CategoryFieldConfig } from '@/types';
import { PRICE_KEYS } from '@/utils/constants';
import { Badge } from '@/components/ui/Badge';

export interface FieldGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  fields: CategoryFieldConfig[];
}

const CORE_PARAM_KEYS = new Set([
  'flux',
  'waterFlowRate',
  'waterMode',
  'faucet',
  'roMembraneBrand',
  'heatingElement',
  'heatingCapacity',
  'tempControl',
]);

const FILTER_COST_KEYS = new Set([
  'filterTotalCost',
  'activatedCarbon',
]);

const CERTIFICATION_KEYS = new Set([
  'hasMaternityCert',
  'hasZeroStagnantWater',
  'hasWaterTank',
  'isAutomatic',
]);

const BASE_INFO_KEYS = new Set([
  'brand',
  'name',
  'model',
  'launchYear',
  'isOnSale',
  'dimensions',
]);

export function groupFields(
  allFields: CategoryFieldConfig[],
  _product: Product,
): FieldGroup[] {
  const baseFields: CategoryFieldConfig[] = [];
  const priceFields: CategoryFieldConfig[] = [];
  const coreFields: CategoryFieldConfig[] = [];
  const filterFields: CategoryFieldConfig[] = [];
  const certFields: CategoryFieldConfig[] = [];
  const otherFields: CategoryFieldConfig[] = [];

  for (const f of allFields) {
    const key = String(f.key);
    if (BASE_INFO_KEYS.has(key)) {
      baseFields.push(f);
    } else if (PRICE_KEYS.has(key)) {
      priceFields.push(f);
    } else if (CORE_PARAM_KEYS.has(key)) {
      coreFields.push(f);
    } else if (FILTER_COST_KEYS.has(key)) {
      filterFields.push(f);
    } else if (CERTIFICATION_KEYS.has(key)) {
      certFields.push(f);
    } else if (f.type === 'images' || f.type === 'videos' || f.type === 'image') {
      // skip — handled by separate sections
    } else {
      otherFields.push(f);
    }
  }

  const groups: FieldGroup[] = [];
  if (baseFields.length > 0) {
    groups.push({
      key: 'base',
      label: '基础信息',
      icon: <Info className="w-4 h-4" />,
      fields: baseFields,
    });
  }
  if (priceFields.length > 0) {
    groups.push({
      key: 'price',
      label: '价格信息',
      icon: <DollarSign className="w-4 h-4" />,
      fields: priceFields,
    });
  }
  if (coreFields.length > 0) {
    groups.push({
      key: 'core',
      label: '核心参数',
      icon: <Settings className="w-4 h-4" />,
      fields: coreFields,
    });
  }
  if (filterFields.length > 0) {
    groups.push({
      key: 'filter',
      label: '滤芯耗材',
      icon: <Droplets className="w-4 h-4" />,
      fields: filterFields,
    });
  }
  if (certFields.length > 0) {
    groups.push({
      key: 'cert',
      label: '认证与功能',
      icon: <ShieldCheck className="w-4 h-4" />,
      fields: certFields,
    });
  }
  if (otherFields.length > 0) {
    groups.push({
      key: 'other',
      label: '其他属性',
      icon: <Info className="w-4 h-4" />,
      fields: otherFields,
    });
  }
  return groups;
}

const HIGHLIGHT_KEYS = new Set([
  'referencePrice',
  'dailyPrice',
  'flux',
  'waterFlowRate',
  'filterTotalCost',
]);

export function isHighlightField(field: CategoryFieldConfig): boolean {
  return HIGHLIGHT_KEYS.has(String(field.key));
}

export function renderFieldValue(
  field: CategoryFieldConfig,
  value: unknown,
): React.ReactNode {
  const isPrice = PRICE_KEYS.has(String(field.key));

  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return <span className="text-gray-300">-</span>;
  }

  if (field.type === 'boolean') {
    return value ? (
      <Badge variant="success" className="text-xs px-2 py-0.5">是</Badge>
    ) : (
      <Badge variant="secondary" className="text-xs px-2 py-0.5">否</Badge>
    );
  }

  if (field.type === 'image') {
    return value ? '已上传' : '-';
  }

  if (field.type === 'images') {
    return `${(value as string[]).length} 张`;
  }

  if (field.type === 'videos') {
    return `${(value as string[]).length} 个`;
  }

  if (isPrice) {
    return `¥${Number(value).toLocaleString()}`;
  }

  return String(value);
}

export function cn(
  ...classes: (string | false | undefined | null)[]
): string {
  return classes.filter(Boolean).join(' ');
}
