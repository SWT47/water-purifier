import React from 'react';
import { X, GripVertical } from 'lucide-react';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Product, ProductCategory } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { productTitle } from '@/utils/format';

interface SortableProductListProps {
  products: Product[];
  onRemove: (id: string) => void;
}

const SortableProductList: React.FC<SortableProductListProps> = ({
  products,
  onRemove,
}) => {
  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
        <span className="text-sm">还没有选择产品</span>
        <p className="text-xs mt-1">从左侧点击「加入搭配」开始</p>
      </div>
    );
  }

  return (
    <SortableContext
      items={products.map((p: Product) => p.id)}
      strategy={verticalListSortingStrategy}
    >
      {products.map((p: Product, idx: number) => (
        <SortableItem
          key={p.id}
          product={p}
          index={idx}
          onRemove={onRemove}
        />
      ))}
    </SortableContext>
  );
};

interface SortableItemProps {
  product: Product;
  index: number;
  onRemove: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ product, index, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: product.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-3 p-2.5 mb-2 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center text-gray-400 cursor-grab active:cursor-grabbing pt-1"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="absolute top-0 left-0 bg-cyan-500 text-white text-[10px] w-4 h-4 flex items-center justify-center font-bold rounded-bl-md">
          {index + 1}
        </div>
        {product.whiteBgImage ? (
          <img
            src={product.whiteBgImage}
            alt={productTitle(product)}
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <div className="text-[10px] text-gray-400">无图</div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="text-[10px] text-cyan-600 font-medium">
          {CATEGORY_LABELS[product.category as ProductCategory]}
        </span>
        <span className="text-xs text-gray-500 truncate">
          {product.brand || '未知品牌'}
        </span>
        <h4 className="text-sm font-semibold text-gray-900 leading-tight truncate">
          {productTitle(product)}
        </h4>
        {product.referencePrice != null && (
          <span className="text-sm font-bold text-blue-600">
            ¥{product.referencePrice.toLocaleString()}
          </span>
        )}
      </div>
      <button
        className="self-start p-1 text-gray-400 hover:text-red-500 transition-colors"
        onClick={() => onRemove(product.id)}
        title="移除"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SortableProductList;
