import { useMemo } from 'react'
import { Search, Grid3X3, List } from 'lucide-react'
import type { ProductCategory } from '@/types'
import { CATEGORY_OPTIONS } from '@/utils/categories'
import type { CategoryOption } from '@/utils/categories'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Button from '@/components/ui/button'

interface FilterBarProps {
  keyword: string
  onKeywordChange: (value: string) => void
  category: ProductCategory | ''
  onCategoryChange: (value: ProductCategory | '') => void
  brand: string
  onBrandChange: (value: string) => void
  brands: string[]
  viewMode: 'card' | 'table'
  onViewModeChange: (mode: 'card' | 'table') => void
  onSearch: () => void
}

export default function FilterBar({
  keyword,
  onKeywordChange,
  category,
  onCategoryChange,
  brand,
  onBrandChange,
  brands,
  viewMode,
  onViewModeChange,
  onSearch,
}: FilterBarProps) {
  const brandOptions = useMemo(() => {
    return ['全部品牌', ...brands]
  }, [brands])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch()
  }

  return (
    <div className="bg-white rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 mb-4 border border-[#E5E7EB]">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* 搜索框 */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="搜索产品名称、品牌、型号..."
            value={keyword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onKeywordChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>

        {/* 筛选器 */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onCategoryChange(e.target.value as ProductCategory | '')
            }
            className="w-36"
          >
            {CATEGORY_OPTIONS.map((opt: CategoryOption) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={brand}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onBrandChange(e.target.value)}
            className="w-36"
          >
            {brandOptions.map((b: string) => (
              <option key={b} value={b === '全部品牌' ? '' : b}>
                {b}
              </option>
            ))}
          </Select>

          <Button onClick={onSearch}>搜索</Button>

          {/* 视图切换 */}
          <div className="flex items-center border border-[#E5E7EB] rounded-[6px] overflow-hidden ml-auto">
            <button
              onClick={() => onViewModeChange('card')}
              className={`p-2 transition-colors ${
                viewMode === 'card'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
              title="卡片视图"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
              title="表格视图"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
