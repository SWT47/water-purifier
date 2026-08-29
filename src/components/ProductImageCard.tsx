import type { Product } from '@/types'
import { CORE_PARAMS, getCategoryLabel } from '@/utils/categories'
import Badge from './ui/badge'

interface ProductImageCardProps {
  product: Product
  onClick: () => void
}

export default function ProductImageCard({
  product,
  onClick,
}: ProductImageCardProps) {
  const coreParams = CORE_PARAMS[product.category] || []
  const displayParams = coreParams.slice(0, 5)

  const formatPrice = (price: number): string => {
    return price.toLocaleString('zh-CN')
  }

  const getParamValue = (key: string): string => {
    const value = product.params[key]
    if (value === undefined || value === null) return '-'
    if (typeof value === 'boolean') return value ? '支持' : '不支持'
    return String(value)
  }

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden border border-transparent hover:border-gray-200"
    >
      {/* 产品白底图 */}
      <div className="aspect-square bg-gray-50 overflow-hidden relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <Badge variant="primary" className="absolute top-3 left-3">
          {getCategoryLabel(product.category)}
        </Badge>
      </div>

      {/* 信息区 */}
      <div className="p-4 space-y-2">
        {/* 品牌 */}
        <div className="text-xs text-gray-400">{product.brand}</div>

        {/* 名称 */}
        <div className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </div>

        {/* 参考价 */}
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-gray-400">参考价</span>
          <span className="text-lg font-semibold text-[#2563EB]">
            ¥{formatPrice(product.referencePrice)}
          </span>
        </div>

        {/* 核心参数 */}
        {displayParams.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-gray-100">
            {displayParams.map((key: string) => (
              <div key={key} className="flex flex-col text-xs">
                <span className="text-gray-400">{key}</span>
                <span className="text-gray-700 truncate font-medium">
                  {getParamValue(key)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
