import { useState } from 'react'
import type { Product, ProductCategory } from '@/types'
import { CORE_PARAMS, getCategoryLabel, CATEGORY_LABEL_MAP } from '@/utils/categories'
import Dialog from './ui/dialog'
import Badge from './ui/badge'
import AlertDialog from './ui/alert-dialog'
import { Play, X, ChevronRight } from 'lucide-react'

interface ProductDetailModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
}

const PARAM_GROUPS: Record<string, string[]> = {
  '基础信息': ['品牌', '型号', '类目'],
  '核心参数': [],
  '过滤系统': ['RO膜品牌', '滤芯年成本', '0陈水', '过滤精度'],
  '性能指标': ['通量', '出水速度', '制热能力', '控温方式', '全自动冲洗'],
  '其他参数': ['额定功率', '外形尺寸', '适用水压', '产品重量'],
}

function getAllParamKeys(category: ProductCategory): string[] {
  const coreKeys = CORE_PARAMS[category] || []
  const otherKeys = Object.values(PARAM_GROUPS).flat()
  return Array.from(new Set([...coreKeys, ...otherKeys]))
}

function groupParams(product: Product): Record<string, Array<{ key: string; value: string }>> {
  const result: Record<string, Array<{ key: string; value: string }>> = {}
  const usedKeys = new Set<string>()
  const allKeys = Object.keys(product.params)

  const formatValue = (value: unknown): string => {
    if (value === undefined || value === null) return '-'
    if (typeof value === 'boolean') return value ? '支持' : '不支持'
    return String(value)
  }

  // 核心参数组
  const coreKeys = CORE_PARAMS[product.category] || []
  if (coreKeys.length > 0) {
    result['核心参数'] = coreKeys
      .filter((k: string) => allKeys.includes(k))
      .map((k: string) => {
        usedKeys.add(k)
        return { key: k, value: formatValue(product.params[k]) }
      })
  }

  // 其他分组
  for (const [groupName, keys] of Object.entries(PARAM_GROUPS)) {
    if (groupName === '核心参数') continue
    if (keys.length === 0) continue
    const groupParams = keys
      .filter((k: string) => allKeys.includes(k) && !usedKeys.has(k))
      .map((k: string) => {
        usedKeys.add(k)
        return { key: k, value: formatValue(product.params[k]) }
      })
    if (groupParams.length > 0) {
      result[groupName] = groupParams
    }
  }

  // 剩余参数归为其他
  const remaining = allKeys
    .filter((k: string) => !usedKeys.has(k) && k !== '')
    .map((k: string) => ({ key: k, value: formatValue(product.params[k]) }))
  if (remaining.length > 0) {
    if (result['其他参数']) {
      result['其他参数'] = [...result['其他参数'], ...remaining]
    } else {
      result['其他参数'] = remaining
    }
  }

  return result
}

export default function ProductDetailModal({
  open,
  product,
  onClose,
}: ProductDetailModalProps) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState<string>('')

  if (!product) return null

  const paramGroups = groupParams(product)
  const realImages = product.realImages && product.realImages.length > 0
    ? product.realImages
    : [product.imageUrl]

  const handleImageClick = (imgUrl: string) => {
    setCurrentImage(imgUrl)
    setImageViewerOpen(true)
  }

  const formatPrice = (price: number): string => {
    return price.toLocaleString('zh-CN')
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="产品详情"
        maxWidth="max-w-4xl"
      >
        <div className="p-5">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 左侧：主图 + 实拍图 */}
            <div className="w-full lg:w-2/5 flex-shrink-0">
              <div className="aspect-square bg-gray-50 rounded-[6px] overflow-hidden border border-[#E5E7EB]">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              </div>

              {/* 实拍图 */}
              {realImages.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-1.5">
                    <span>实拍图</span>
                    <span className="text-xs text-gray-400">
                      （点击放大）
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {realImages.slice(0, 8).map((img: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => handleImageClick(img)}
                        className="aspect-square rounded-[6px] overflow-hidden border border-[#E5E7EB] cursor-pointer hover:border-blue-400 transition-colors"
                      >
                        <img
                          src={img}
                          alt={`实拍图${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 实拍视频 */}
              {product.realVideoUrl && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-1.5">
                    <Play size={14} />
                    <span>实拍视频</span>
                  </div>
                  <div className="aspect-video bg-black rounded-[6px] overflow-hidden">
                    <video
                      src={product.realVideoUrl}
                      controls
                      className="w-full h-full object-contain"
                      preload="metadata"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：产品信息 */}
            <div className="w-full lg:w-3/5 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <Badge variant="primary" className="mb-2">
                    {getCategoryLabel(product.category)}
                  </Badge>
                  <h2 className="text-xl font-semibold text-gray-900 leading-tight">
                    {product.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {product.brand} · {product.model || '型号待定'}
                  </p>
                </div>
              </div>

              {/* 价格 */}
              <div className="bg-blue-50 rounded-[6px] p-4 mb-4 border border-blue-100">
                <div className="text-xs text-gray-500 mb-1">参考价格</div>
                <div className="text-3xl font-bold text-[#2563EB]">
                  ¥{formatPrice(product.referencePrice)}
                </div>
              </div>

              {/* 描述 */}
              {product.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* 参数分组展示 */}
              <div className="space-y-4">
                {Object.entries(paramGroups).map(([groupName, params]) => (
                  <div key={groupName}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-black rounded-sm" />
                      <span className="text-sm font-semibold text-gray-900">
                        {groupName}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 bg-gray-50 rounded-[6px] p-3">
                      {params.map(({ key, value }) => (
                        <div
                          key={key}
                          className="flex items-start text-sm"
                        >
                          <span className="text-gray-500 w-24 flex-shrink-0">
                            {key}
                          </span>
                          <ChevronRight size={14} className="text-gray-300 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-800 font-medium flex-1 break-words">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* 图片放大查看 */}
      <AlertDialog
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
      >
        <div className="relative">
          <button
            onClick={() => setImageViewerOpen(false)}
            className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={currentImage}
            alt="放大图片"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-[6px]"
          />
        </div>
      </AlertDialog>
    </>
  )
}
