import React, { useMemo } from 'react';
import { Image } from '@client/src/components/ui/image';
import {
  type Product,
  type ProductCategory,
} from '@shared/api.interface';

interface ProductImageCardProps {
  product: Product;
  category: ProductCategory;
  sellingPoints?: string[];
  size?: 'normal' | 'large';
  isSelected?: boolean;
  onClick?: () => void;
}

const PRICE_COLOR = '#2563EB';

interface CoreParamConfig {
  key: keyof Product;
  label: string;
  suffix?: string;
  booleanTrueLabel?: string;
  booleanFalseLabel?: string;
  isPrice?: boolean;
}

const CORE_PARAMS: Record<ProductCategory, CoreParamConfig[]> = {
  water_purifier: [
    { key: 'flux', label: '通量' },
    { key: 'waterFlowRate', label: '出水速度' },
    { key: 'roMembraneBrand', label: 'RO膜品牌' },
    { key: 'filterTotalCost', label: '滤芯年成本', isPrice: true },
    { key: 'hasZeroStagnantWater', label: '0陈水', booleanTrueLabel: '支持', booleanFalseLabel: '—' },
  ],
  pipeline_machine: [
    { key: 'heatingCapacity', label: '制热能力' },
    { key: 'tempControl', label: '控温方式' },
    { key: 'hasWaterTank', label: '内置水箱', booleanTrueLabel: '有', booleanFalseLabel: '无' },
  ],
  pre_filter: [
    { key: 'flux', label: '通量' },
    { key: 'isAutomatic', label: '全自动冲洗', booleanTrueLabel: '支持', booleanFalseLabel: '—' },
  ],
  big_white_bottle: [],
  central_purifier: [],
  central_softener: [],
};

const SELLING_POINT_KEYS: Record<ProductCategory, Array<{
  key: keyof Product;
  prefix?: string;
  suffix?: string;
  booleanTrueLabel?: string;
}>> = {
  water_purifier: [
    { key: 'flux', suffix: '大通量' },
    { key: 'hasZeroStagnantWater', booleanTrueLabel: '0陈水技术' },
    { key: 'hasMaternityCert', booleanTrueLabel: '母婴级认证' },
    { key: 'waterMode', prefix: '', suffix: '' },
  ],
  pipeline_machine: [
    { key: 'heatingCapacity', prefix: '', suffix: '' },
    { key: 'tempControl', prefix: '', suffix: '' },
    { key: 'hasWaterTank', booleanTrueLabel: '带水箱' },
  ],
  pre_filter: [
    { key: 'flux', suffix: '大通量' },
    { key: 'isAutomatic', booleanTrueLabel: '全自动冲洗' },
  ],
  big_white_bottle: [],
  central_purifier: [],
  central_softener: [],
};

const ProductImageCard: React.FC<ProductImageCardProps> = ({
  product,
  category,
  sellingPoints,
  size = 'normal',
  isSelected = false,
  onClick,
}) => {
  const cardImage = product.whiteBgImage || '';

  const displaySellingPoints = useMemo(() => {
    if (sellingPoints && sellingPoints.length > 0) {
      return sellingPoints.slice(0, 5);
    }
    const configs = SELLING_POINT_KEYS[category] || [];
    const points: string[] = [];
    for (const cfg of configs) {
      const v = product[cfg.key];
      if (cfg.booleanTrueLabel !== undefined) {
        if (v === true) points.push(cfg.booleanTrueLabel);
      } else if (v !== null && v !== undefined && v !== '') {
        const prefix = cfg.prefix ?? '';
        const suffix = cfg.suffix ?? '';
        points.push(`${prefix}${String(v)}${suffix}`);
      }
      if (points.length >= 5) break;
    }
    return points;
  }, [sellingPoints, category, product]);

  const coreParams = useMemo(() => {
    const configs = CORE_PARAMS[category] || [];
    const params: { label: string; value: React.ReactNode; isPrice?: boolean }[] = [];
    for (const cfg of configs) {
      const v = product[cfg.key];
      let displayValue: React.ReactNode = null;
      if (cfg.booleanTrueLabel !== undefined && cfg.booleanFalseLabel !== undefined) {
        displayValue = v === true ? cfg.booleanTrueLabel : cfg.booleanFalseLabel;
      } else if (cfg.isPrice) {
        if (v !== null && v !== undefined && v !== '') {
          displayValue = `¥${Number(v).toLocaleString()}`;
        } else {
          displayValue = '—';
        }
      } else if (v !== null && v !== undefined && v !== '') {
        displayValue = String(v) + (cfg.suffix || '');
      } else {
        displayValue = '—';
      }
      params.push({ label: cfg.label, value: displayValue, isPrice: cfg.isPrice });
      if (params.length >= 5) break;
    }
    return params;
  }, [category, product]);

  const productTitle = product.name
    ? `${product.name}${product.model ? ' ' + product.model : ''}`
    : product.model || '产品名称';

  const displayPrice = product.dailyPrice ?? product.referencePrice;
  const originalPrice = product.dailyPrice && product.referencePrice && product.referencePrice !== product.dailyPrice
    ? product.referencePrice
    : null;

  const isLarge = size === 'large';
  const imageHeight = isLarge ? 'h-72' : 'h-56';
  const cardPadding = isLarge ? 'p-5' : 'p-4';
  const titleSize = isLarge ? 'text-xl' : 'text-lg';
  const priceSize = isLarge ? 'text-2xl' : 'text-xl';

  return (
    <div
      className={[
        'bg-white rounded-[6px] overflow-hidden flex flex-col',
        'shadow-[0_1px_3px_rgba(0_0_0_0.06),0_2px_8px_rgba(0_0_0_0.04)]',
        'transition-all duration-200 ease-out',
        'border border-transparent',
        isSelected
          ? 'border-cyan-500 bg-cyan-50/30 shadow-[0_0_0_3px_rgba(6_182_212_0.15),0_8px_24px_rgba(6_182_212_0.2)] scale-[1.02]'
          : '',
        onClick
          ? 'cursor-pointer hover:-translate-y-1 hover:scale-[1.03] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6_182_212_0.25),0_12px_32px_rgba(0_0_0_0.12)]'
          : '',
      ].join(' ')}
      onClick={onClick}
      data-ai-section-type="card-list"
    >
      {/* 1. 白底图展示区 */}
      <div
        className={[
          'relative w-full flex items-center justify-center overflow-hidden',
          imageHeight,
          'bg-gradient-to-b from-gray-50 to-gray-100',
        ].join(' ')}
      >
        {cardImage ? (
          <Image
            src={cardImage}
            alt={productTitle}
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            width={400}
            height={300}
          />
        ) : (
          <div className="text-gray-400 text-sm">暂无图片</div>
        )}
      </div>

      {/* 内容区 */}
      <div className={['flex-1 flex flex-col gap-3', cardPadding].join(' ')}>
        {/* 2. 品牌+产品名称 */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-500 font-medium">
            {product.brand || '未知品牌'}
          </span>
          <h3
            className={[
              'font-semibold text-gray-900 leading-tight truncate',
              titleSize,
            ].join(' ')}
            title={productTitle}
          >
            {productTitle}
          </h3>
        </div>

        {/* 3. 卖点标签 */}
        {displaySellingPoints.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displaySellingPoints.map((point: string, idx: number) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded bg-blue-50 text-blue-600 leading-tight"
              >
                {point}
              </span>
            ))}
          </div>
        )}

        {/* 4. 核心参数网格 */}
        {coreParams.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {coreParams.map((param, idx: number) => (
              <div
                key={idx}
                className="flex flex-col gap-0.5 py-1.5 px-2.5 bg-gray-50 rounded-md"
              >
                <span className="text-[11px] text-gray-400 leading-tight">
                  {param.label}
                </span>
                <span
                  className={[
                    'text-sm font-medium leading-tight truncate',
                    param.isPrice ? 'text-blue-600 font-semibold' : 'text-gray-800',
                  ].join(' ')}
                  title={String(param.value)}
                >
                  {param.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 5. 价格区 */}
        <div className="mt-auto pt-2 flex items-baseline gap-2">
          {displayPrice !== null && displayPrice !== undefined ? (
            <>
              <span
                className={['font-bold leading-tight', priceSize].join(' ')}
                style={{ color: PRICE_COLOR }}
              >
                ¥{displayPrice.toLocaleString()}
              </span>
              {originalPrice !== null && originalPrice !== undefined && (
                <span className="text-sm text-gray-400 line-through">
                  ¥{originalPrice.toLocaleString()}
                </span>
              )}
            </>
          ) : (
            <span className="text-base text-gray-400">价格待定</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductImageCard;
