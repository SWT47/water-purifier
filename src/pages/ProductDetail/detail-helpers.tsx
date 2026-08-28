import React from 'react';
import {
  Tag,
  Image,
  Video,
  Settings,
  DollarSign,
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

export function groupFields(
  allFields: CategoryFieldConfig[],
  _product: Product,
): FieldGroup[] {
  const priceFields: CategoryFieldConfig[] = [];
  const coreFields: CategoryFieldConfig[] = [];
  const imageFields: CategoryFieldConfig[] = [];
  const videoFields: CategoryFieldConfig[] = [];
  const otherFields: CategoryFieldConfig[] = [];

  const coreKeys = new Set([
    'flux',
    'waterFlowRate',
    'waterMode',
    'faucet',
    'dimensions',
    'roMembraneBrand',
    'filterTotalCost',
    'activatedCarbon',
    'heatingElement',
    'heatingCapacity',
    'tempControl',
    'hasWaterTank',
    'isAutomatic',
    'hasMaternityCert',
    'hasZeroStagnantWater',
  ]);

  for (const f of allFields) {
    const key = String(f.key);
    if (PRICE_KEYS.has(key)) {
      priceFields.push(f);
    } else if (f.type === 'images' || f.type === 'image') {
      imageFields.push(f);
    } else if (f.type === 'videos') {
      videoFields.push(f);
    } else if (coreKeys.has(key)) {
      coreFields.push(f);
    } else {
      otherFields.push(f);
    }
  }

  const groups: FieldGroup[] = [];
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
  if (imageFields.length > 0) {
    groups.push({
      key: 'image',
      label: '图片资料',
      icon: <Image className="w-4 h-4" />,
      fields: imageFields,
    });
  }
  if (videoFields.length > 0) {
    groups.push({
      key: 'video',
      label: '视频资料',
      icon: <Video className="w-4 h-4" />,
      fields: videoFields,
    });
  }
  if (otherFields.length > 0) {
    groups.push({
      key: 'other',
      label: '其他属性',
      icon: <Tag className="w-4 h-4" />,
      fields: otherFields,
    });
  }
  return groups;
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
      <Badge variant="success">是</Badge>
    ) : (
      <Badge variant="secondary">否</Badge>
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
