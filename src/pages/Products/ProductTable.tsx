import type { Product } from '@/types'
import { getCategoryLabel } from '@/utils/categories'
import Badge from '@/components/ui/badge'

interface ProductTableProps {
  products: Product[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRowClick: (product: Product) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export default function ProductTable({
  products,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: ProductTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endIdx = Math.min(page * pageSize, total)

  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) return '-'
    return price.toLocaleString('zh-CN')
  }

  const renderPageNumbers = () => {
    const pages: (number | '...')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, page - 1)
      let end = Math.min(totalPages - 1, page + 1)

      if (page <= 3) {
        end = maxVisible - 1
      } else if (page >= totalPages - 2) {
        start = totalPages - (maxVisible - 2)
      }

      if (start > 2) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const colCount = 7

  return (
    <div className="bg-white rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E5E7EB] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[13px] whitespace-nowrap">
                类目
              </th>
              <th className="text-left px-4 py-3 font-medium text-[13px] whitespace-nowrap">
                品牌
              </th>
              <th className="text-left px-4 py-3 font-medium text-[13px] whitespace-nowrap">
                产品名称
              </th>
              <th className="text-left px-4 py-3 font-medium text-[13px] whitespace-nowrap">
                型号
              </th>
              <th className="text-left px-4 py-3 font-medium text-[13px] whitespace-nowrap">
                通量
              </th>
              <th className="text-right px-4 py-3 font-medium text-[13px] whitespace-nowrap w-32">
                参考价
              </th>
              <th className="text-center px-4 py-3 font-medium text-[13px] whitespace-nowrap w-24">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="text-center py-12 text-gray-400"
                >
                  加载中...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="text-center py-12 text-gray-400"
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              products.map((product: Product) => (
                <tr
                  key={product.id}
                  onClick={() => onRowClick(product)}
                  className="border-t border-[#E5E7EB] hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {getCategoryLabel(product.category)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {product.brand}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium max-w-xs truncate group-hover:text-[#2563EB] transition-colors">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {product.model || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {product.flux || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-semibold text-base ${
                        product.referencePrice !== undefined
                        && product.referencePrice !== null
                          ? 'text-[#2563EB]'
                          : 'text-gray-400'
                      }`}
                    >
                      {product.referencePrice !== undefined
                      && product.referencePrice !== null
                        ? `¥${formatPrice(product.referencePrice)}`
                        : '-'}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-center"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRowClick(product)
                    }}
                  >
                    <span className="text-[#2563EB] text-sm hover:underline">
                      查看详情
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E5E7EB]">
        <div className="text-xs text-gray-500">
          共 <span className="font-medium text-gray-700">{total}</span> 条，
          显示 {startIdx}-{endIdx}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                onPageChange(1)
              }}
              className="h-7 rounded-[6px] border border-[#E5E7EB] px-2 text-xs focus:outline-none focus:border-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map((size: number) => (
                <option key={size} value={size}>
                  {size} 条
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-7 px-2.5 text-xs rounded-[6px] border border-[#E5E7EB] bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>

            {renderPageNumbers().map((p: number | '...', idx: number) =>
              p === '...' ? (
                <span
                  key={`dot-${idx}`}
                  className="h-7 w-7 flex items-center justify-center text-xs text-gray-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`h-7 min-w-7 px-2 text-xs rounded-[6px] transition-colors ${
                    p === page
                      ? 'bg-black text-white font-medium'
                      : 'border border-[#E5E7EB] bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="h-7 px-2.5 text-xs rounded-[6px] border border-[#E5E7EB] bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
