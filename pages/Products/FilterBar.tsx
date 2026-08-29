import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Upload,
  GitCompare,
  X,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  CATEGORY_LABELS,
  type ProductCategory,
} from '@client/src/utils/categories';

export interface FilterValues {
  keyword: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
}

export type ViewMode = 'table' | 'card';

interface FilterBarProps {
  category: ProductCategory;
  brands: string[];
  selectedCount: number;
  viewMode: ViewMode;
  onFilterChange: (values: FilterValues) => void;
  onAdd: () => void;
  onImport: () => void;
  onCompare: () => void;
  onViewModeChange: (mode: ViewMode) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  category,
  brands,
  selectedCount,
  viewMode,
  onFilterChange,
  onAdd,
  onImport,
  onCompare,
  onViewModeChange,
}) => {
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // debounce keyword
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onFilterChange({ keyword, brand, minPrice, maxPrice });
    }, 300);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, brand, minPrice, maxPrice]);

  const categoryLabel = CATEGORY_LABELS[category] || '产品';

  const resetFilters = () => {
    setKeyword('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
  };

  const hasFilters = keyword || brand || minPrice || maxPrice;

  return (
    <div className="flex flex-col gap-3 px-6 py-4 bg-white border-b border-gray-200">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            {categoryLabel}列表
          </h2>
          {selectedCount > 0 && (
            <span className="text-xs text-gray-500">
              已选 {selectedCount} 项
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => onViewModeChange('table')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="表格模式"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('card')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'card'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="图片卡片模式"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onImport}
            className="text-gray-700"
          >
            <Upload className="w-4 h-4" />
            Excel导入
          </Button>
          <Button
            size="sm"
            onClick={onCompare}
            disabled={selectedCount === 0}
            className={selectedCount > 0 ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <GitCompare className="w-4 h-4" />
            加入对比
          </Button>
          <Button size="sm" onClick={onAdd} className="bg-black hover:bg-gray-800">
            <Plus className="w-4 h-4" />
            新增产品
          </Button>
        </div>
      </div>

      {/* 筛选行 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setKeyword(e.target.value)
            }
            placeholder="搜索名称/型号/品牌..."
            className="pl-10"
          />
        </div>

        <div className="min-w-[140px]">
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="品牌筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部品牌</SelectItem>
              {brands.map((b: string) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Input
            type="number"
            value={minPrice}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMinPrice(e.target.value)
            }
            placeholder="最低价"
            className="w-24 h-9"
          />
          <span>~</span>
          <Input
            type="number"
            value={maxPrice}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMaxPrice(e.target.value)
            }
            placeholder="最高价"
            className="w-24 h-9"
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-gray-500"
          >
            <X className="w-3.5 h-3.5" />
            清空
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
