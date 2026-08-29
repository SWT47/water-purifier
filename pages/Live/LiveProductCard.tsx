import React from 'react';
import ProductImageCard from '@client/src/components/ProductImageCard';
import type {
  Product,
  ProductCategory,
} from '@shared/api.interface';

interface LiveProductCardProps {
  product: Product;
  category: ProductCategory;
  isSelected?: boolean;
  onSelect?: (product: Product) => void;
}

const LiveProductCard: React.FC<LiveProductCardProps> = ({
  product,
  category,
  isSelected = false,
  onSelect,
}) => {
  return (
    <ProductImageCard
      product={product}
      category={category}
      size="large"
      isSelected={isSelected}
      onClick={() => onSelect?.(product)}
    />
  );
};

export default LiveProductCard;
