import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import Image from '@client/src/components/ui/image';
import {
  Play,
  ChevronLeft,
  ChevronRight,
  X,
  Image as ImageIcon,
  VideoIcon,
} from 'lucide-react';
import {
  CATEGORY_FIELDS,
  CATEGORY_PARAM_GROUPS,
  type Product,
  type ProductCategory,
  type CategoryFieldConfig,
  type ParamGroupConfig,
} from '@shared/api.interface';

interface ProductDetailModalProps {
  open: boolean;
  product: Product | null;
  category: ProductCategory;
  onClose: () => void;
}

const PRICE_KEYS = new Set([
  'dailyPrice',
  'referencePrice',
  'filterTotalCost',
]);

const HIGHLIGHT_KEYS = new Set([
  'flux',
  'waterFlowRate',
  'roMembraneBrand',
  'hasZeroStagnantWater',
  'hasMaternityCert',
]);

const formatValue = (
  field: CategoryFieldConfig,
  value: unknown,
): React.ReactNode => {
  if (value === null || value === undefined || value === '') return '-';

  if (field.type === 'image') return null;
  if (field.type === 'images') {
    const arr = value as string[];
    return `${arr.length} 张`;
  }
  if (field.type === 'videos') {
    const arr = value as string[];
    return `${arr.length} 个`;
  }
  if (field.type === 'boolean') {
    return value ? '是' : '否';
  }
  if (PRICE_KEYS.has(String(field.key))) {
    return `¥${Number(value).toLocaleString()}`;
  }
  return String(value);
};

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  open,
  product,
  category,
  onClose,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const realImages = product?.realImages ?? [];
  const realVideos = product?.realVideos ?? [];
  const fields = CATEGORY_FIELDS[category] || [];
  const groups = CATEGORY_PARAM_GROUPS[category] || [];
  const fieldMap = React.useMemo(() => {
    const map: Record<string, CategoryFieldConfig> = {};
    for (const f of fields) {
      map[String(f.key)] = f;
    }
    return map;
  }, [fields]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const prevLightbox = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === 0 ? realImages.length - 1 : prev - 1,
    );
  }, [realImages.length]);

  const nextLightbox = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === realImages.length - 1 ? 0 : prev + 1,
    );
  }, [realImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, prevLightbox, nextLightbox]);

  const openVideo = (index: number) => {
    setActiveVideoIndex(index);
    setVideoModalOpen(true);
  };

  const prevVideo = useCallback(() => {
    setActiveVideoIndex((prev) =>
      prev === 0 ? realVideos.length - 1 : prev - 1,
    );
  }, [realVideos.length]);

  const nextVideo = useCallback(() => {
    setActiveVideoIndex((prev) =>
      prev === realVideos.length - 1 ? 0 : prev + 1,
    );
  }, [realVideos.length]);

  useEffect(() => {
    if (!videoModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevVideo();
      if (e.key === 'ArrowRight') nextVideo();
      if (e.key === 'Escape') setVideoModalOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [videoModalOpen, prevVideo, nextVideo]);

  const displayFields = fields.filter(
    (f: CategoryFieldConfig) =>
      f.type !== 'image' && f.type !== 'images' && f.type !== 'videos',
  );

  const visibleGroups = groups
    .map((g: ParamGroupConfig) => ({
      ...g,
      fields: g.fields.filter((k: string) => fieldMap[k]),
    }))
    .filter((g: ParamGroupConfig & { fields: string[] }) => g.fields.length > 0);

  if (!product) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
        <DialogContent className="max-w-6xl w-[92vw] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <DialogTitle className="text-base font-semibold">
              {product.brand || ''} {product.name || product.model || ''}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-8 p-6">
            {/* 左侧白底图主图区 */}
            <div className="w-64 flex-shrink-0">
              <div className="relative w-full aspect-square bg-gradient-to-b from-gray-50 to-white border border-gray-100 rounded-[6px] overflow-hidden shadow-sm mb-3">
                {product.whiteBgImage ? (
                  <div className="w-full h-full flex items-center justify-center p-5">
                    <Image
                      src={product.whiteBgImage}
                      alt="产品白底图"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    暂无图片
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>产品白底图</span>
              </div>
            </div>

            {/* 右侧信息区 */}
            <div className="flex-1 min-w-0">
              {/* 价格区 */}
              <div className="mb-5 pb-5 border-b border-gray-100">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-xs text-gray-500">参考价</span>
                  <span className="text-3xl font-bold text-blue-600">
                    ¥{product.referencePrice?.toLocaleString() ?? '—'}
                  </span>
                  {product.dailyPrice !== null &&
                    product.dailyPrice !== undefined &&
                    product.dailyPrice !== product.referencePrice && (
                      <span className="text-sm text-gray-400 line-through">
                        日常 ¥{product.dailyPrice.toLocaleString()}
                      </span>
                    )}
                </div>
                <div className="text-xs text-gray-500">
                  {product.brand || ''} · {product.model || ''}
                </div>
              </div>

              {/* 参数分组展示 */}
              <div className="space-y-5 max-h-[420px] overflow-y-auto pr-2">
                {visibleGroups.map((group: ParamGroupConfig & { fields: string[] }) => (
                  <div key={group.key}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-4 bg-black rounded-full" />
                      <h3 className="text-sm font-semibold text-gray-900">
                        {group.label}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pl-3">
                      {group.fields.map((key: string) => {
                        const field = fieldMap[key];
                        if (!field) return null;
                        const val = product[field.key];
                        const isHighlight = HIGHLIGHT_KEYS.has(key);
                        const isPrice = PRICE_KEYS.has(key);
                        const isBool = field.type === 'boolean';
                        return (
                          <div
                            key={key}
                            className={[
                              'flex flex-col justify-center py-2 px-3 rounded-md',
                              isHighlight
                                ? 'bg-blue-50 border border-blue-100'
                                : 'bg-gray-50',
                            ].join(' ')}
                          >
                            <span className="text-xs text-gray-400 font-normal mb-1">
                              {field.label}
                            </span>
                            {isPrice ? (
                              <span className="text-base font-bold text-blue-600 leading-tight">
                                {formatValue(field, val)}
                              </span>
                            ) : isHighlight ? (
                              <span className="text-sm font-semibold text-gray-900 leading-tight">
                                {isBool && val ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-medium">
                                    {formatValue(field, val)}
                                  </span>
                                ) : isBool ? (
                                  <span className="text-gray-400 text-sm">
                                    {formatValue(field, val)}
                                  </span>
                                ) : (
                                  formatValue(field, val)
                                )}
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-gray-800 leading-tight">
                                {formatValue(field, val)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 产品实拍图区域 */}
          {realImages.length > 0 && (
            <div className="border-t border-gray-100 px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">
                  产品实拍图
                </span>
                <span className="text-xs text-gray-400">
                  共 {realImages.length} 张
                </span>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {realImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => openLightbox(idx)}
                    className="relative aspect-square bg-white border border-gray-200 rounded-[6px] overflow-hidden hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <Image
                      src={img}
                      alt={`实拍图 ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      width={120}
                      height={120}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded">
                        点击放大
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 产品实拍视频区域 */}
          {realVideos.length > 0 && (
            <div className="border-t border-gray-100 px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <VideoIcon className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">
                  产品实拍视频
                </span>
                <span className="text-xs text-gray-400">
                  共 {realVideos.length} 个
                </span>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {realVideos.map((_: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => openVideo(idx)}
                    className="relative aspect-square bg-gray-900 border border-gray-200 rounded-[6px] overflow-hidden hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 group-hover:scale-105 transition-transform duration-300">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded">
                        点击播放
                      </span>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 text-white text-[10px] text-center bg-black/50 px-1.5 py-0.5 rounded">
                      视频 {idx + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 图片灯箱 */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="bg-black/90 border-0 p-0 max-w-none w-screen h-screen m-0 rounded-none flex items-center justify-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>

          {realImages.length > 1 && (
            <>
              <button
                onClick={prevLightbox}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
                aria-label="上一张"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextLightbox}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
                aria-label="下一张"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center">
            <Image
              src={realImages[lightboxIndex]}
              alt={`实拍图 ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>

          {realImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 max-w-[80vw] overflow-x-auto py-2 px-2 bg-black/40 rounded-[6px]">
              {realImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-14 h-14 flex-shrink-0 border-2 rounded overflow-hidden transition-colors ${
                    idx === lightboxIndex
                      ? 'border-blue-500'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`缩略图 ${idx + 1}`}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="absolute top-4 left-4 text-white text-sm bg-black/40 px-3 py-1 rounded">
            {lightboxIndex + 1} / {realImages.length}
          </div>
        </DialogContent>
      </Dialog>

      {/* 视频弹窗 */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="bg-black/90 border-0 p-0 max-w-none w-screen h-screen m-0 rounded-none flex flex-col items-center justify-center">
          <button
            onClick={() => setVideoModalOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>

          {realVideos.length > 1 && (
            <>
              <button
                onClick={prevVideo}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
                aria-label="上一个视频"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextVideo}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
                aria-label="下一个视频"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative max-w-[85vw] w-full">
            <video
              key={activeVideoIndex}
              src={realVideos[activeVideoIndex]}
              controls
              autoPlay
              className="w-full aspect-video bg-black rounded-[6px]"
            />
          </div>

          {realVideos.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 max-w-[80vw] overflow-x-auto py-2 px-2 bg-black/40 rounded-[6px]">
              {realVideos.map((_: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveVideoIndex(idx)}
                  className={`w-14 h-14 flex-shrink-0 border-2 rounded overflow-hidden transition-colors bg-gray-800 flex items-center justify-center ${idx === activeVideoIndex ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  <span className="absolute bottom-0.5 text-[9px] text-white/70">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="absolute top-4 left-4 text-white text-sm bg-black/40 px-3 py-1 rounded">
            {activeVideoIndex + 1} / {realVideos.length}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductDetailModal;
