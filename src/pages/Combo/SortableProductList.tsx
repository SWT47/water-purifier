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
  if (products.length === 0) return null;

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

const SortableItem: React.FC<SortableItemProps> = ({
  product,
  index,
  onRemove,
}) => {
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
      className="flex items-start gap-2 p-2 rounded-md bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center text-gray-300 cursor-grab active:cursor-grabbing pt-1.5 flex-shrink-0"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      <div className="relative w-12 h-12 flex-shrink-0 rounded bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
        <div className="absolute top-0 left-0 z-10 bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-[10px] w-4 h-4 flex items-center justify-center font-bold rounded-br">
          {index + 1}
        </div>
        {product.whiteBgImage ? (
          <img
            src={product.whiteBgImage}
            alt={productTitle(product)}
            className="w-full h-full object-contain p-0.5"
          />
        ) : (
          <span className="text-[9px] text-gray-400">无图</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-blue-600 font-medium">
          {CATEGORY_LABELS[product.category as ProductCategory]}
        </span>
        <h4 className="text-xs font-semibold text-gray-900 leading-tight truncate mt-0.5">
          {productTitle(product)}
        </h4>
        {product.brand && (
          <span className="text-[10px] text-gray-500 truncate block">
            {product.brand}
          </span>
        )}
        {product.referencePrice != null && (
          <span className="text-sm font-bold text-blue-600 mt-0.5 block">
            ¥{Number(product.referencePrice).toLocaleString()}
          </span>
        )}
      </div>

      <button
        className="self-start p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        onClick={() => onRemove(product.id)}
        title="移除"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default SortableProductList;
