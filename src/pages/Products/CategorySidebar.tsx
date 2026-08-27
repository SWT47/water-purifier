import React from 'react';
import {
  Droplets,
  Thermometer,
  Filter,
  Package,
  Droplet,
  Waves,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  type ProductCategory,
} from '@/utils/constants';
import { cn } from '@/utils/cn';

const ALL_CATEGORIES: ProductCategory[] = [
  'water_purifier',
  'pipeline_machine',
  'pre_filter',
  'big_white_bottle',
  'central_purifier',
  'central_softener',
];

const CATEGORY_ICONS: Record<ProductCategory, React.ReactNode> = {
  water_purifier: <Droplets className="w-4 h-4" />,
  pipeline_machine: <Thermometer className="w-4 h-4" />,
  pre_filter: <Filter className="w-4 h-4" />,
  big_white_bottle: <Package className="w-4 h-4" />,
  central_purifier: <Droplet className="w-4 h-4" />,
  central_softener: <Waves className="w-4 h-4" />,
};

interface CategorySidebarProps {
  activeCategory: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <aside className="w-[220px] flex-shrink-0 bg-white border-r border-gray-200 py-4">
      <div className="px-4 pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        产品类目
      </div>
      <nav className="space-y-0.5">
        {ALL_CATEGORIES.map((cat: ProductCategory) => {
          const isActive = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left',
                isActive
                  ? 'bg-gray-100 text-black font-medium border-r-2 border-black'
                  : 'text-gray-700 hover:bg-gray-50',
              )}
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-md flex items-center justify-center',
                  isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-600',
                )}
              >
                {CATEGORY_ICONS[cat]}
              </span>
              <span>{CATEGORY_LABELS[cat]}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default CategorySidebar;
