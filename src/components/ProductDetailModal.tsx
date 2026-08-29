import { useState } from 'react'
import type { Product } from '@/types'
import {
  ALL_PARAM_GROUPS,
  getCategoryLabel,
  formatProductValue,
} from '@/utils/categories'
import type { CoreParamDef } from '@/utils/categories'
import Dialog from './ui/dialog'
import Badge from './ui/badge'
import AlertDialog from './ui/alert-dialog'
import { Play, X, ChevronRight } from 'lucide-react'

interface ProductDetailModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
}

function groupParams(
  product: Product,
): Record<string, Array<{ label: string; value: string }>> {
  const result: Record<string, Array<{ label: string; value: string }>> = {}

  for (const [groupName, paramDefs] of Object.entries(ALL_PARAM_GROUPS)) {
    const filtered = paramDefs
      .map((def: CoreParamDef) => {
        const rawValue = (product as unknown as Record<string, unknown>)[def.key]
        if (
          rawValue === undefined
          || rawValue === null
          || rawValue === ''
        ) {
          return null
        }
        const formatted = def.format
          ? def.format(rawValue)
          : formatProductValue(rawValue)
        return { label: def.label, value: formatted }
      })
      .filter(
        (item): item is { label: string; value: string } => item !== null,
      )

    if (filtered.length > 0) {
      result[groupName] = filtered
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

  const mainImage = product.whiteBgImage
    || `https://picsum.photos/seed/${product.id}/600/600`

  const realImages =
    product.realImages && product.realImages.length > 0
      ? product.realImages
      : [mainImage]

  const firstVideo =
    product.realVideos && product.realVideos.length > 0
      ? product.realVideos[0]
      : ''

  const handleImageClick = (imgUrl: string) => {
    setCurrentImage(imgUrl)
    setImageViewerOpen(true)
  }

  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) return '-'
    return price.toLocaleString('zh-CN')
  }

  const buildDescription = (): string => {
    const parts: string[] = []
    if (product.model) parts.push(`型号：${product.model}`)
    if (product.launchYear) parts.push(`${product.launchYear}年上市`)
    if (product.brand) parts.push(`${product.brand}出品`)
    if (product.waterMode) parts.push(product.waterMode)
    if (product.flux) parts.push(`通量${product.flux}`)
    return parts.join(' · ')
  }

  const description = buildDescription()

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
                  src={mainImage}
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
              {firstVideo && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-1.5">
                    <Play size={14} />
                    <span>实拍视频</span>
                    <span className="text-xs text-gray-400">
                      （共{product.realVideos.length}个）
                    </span>
                  </div>
                  <div className="aspect-video bg-black rounded-[6px] overflow-hidden">
                    <video
                      src={firstVideo}
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
                    {product.brand || '-'} · {product.model || '型号待定'}
                  </p>
                </div>
              </div>

              {/* 价格 */}
              <div className="bg-blue-50 rounded-[6px] p-4 mb-4 border border-blue-100">
                <div className="flex items-baseline gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">参考价格</div>
                    <div className="text-3xl font-bold text-[#2563EB]">
                      {product.referencePrice !== undefined
                      && product.referencePrice !== null
                        ? `¥${formatPrice(product.referencePrice)}`
                        : '价格待定'}
                    </div>
                  </div>
                  {(product.dailyPrice !== undefined
                    && product.dailyPrice !== null) && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">日常价</div>
                      <div className="text-lg font-semibold text-gray-500 line-through">
                        ¥{formatPrice(product.dailyPrice)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 描述 */}
              {description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {description}
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
                      {params.map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex items-start text-sm"
                        >
                          <span className="text-gray-500 w-24 flex-shrink-0">
                            {label}
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-gray-300 mt-0.5 flex-shrink-0"
                          />
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
