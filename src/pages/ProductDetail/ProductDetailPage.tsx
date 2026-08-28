import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Play,
  X,
  Video,
  Settings,
  DollarSign,
  Info,
  Droplets,
  ShieldCheck,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { getProduct } from '@/api/products';
import type {
  Product,
  CategoryFieldConfig,
  ProductCategory,
} from '@/types';
import {
  CATEGORY_FIELDS,
  CATEGORY_LABELS,
  PRICE_KEYS,
} from '@/utils/constants';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/Dialog';
import { groupFields, type FieldGroup, renderFieldValue, cn } from './detail-helpers';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState<boolean>(false);
  const [activeVideo, setActiveVideo] = useState<number>(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('缺少产品 ID');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProduct(null);
    getProduct(id)
      .then((p: Product) => {
        if (cancelled) return;
        if (!p || !p.id) {
          setError('产品不存在或数据异常');
          return;
        }
        setProduct(p);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[ProductDetail] 获取产品详情失败', err);
        setError(msg || '加载失败');
        toast.error('获取产品详情失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const category = (product?.category as ProductCategory) || 'water_purifier';
  const fields = CATEGORY_FIELDS[category] || [];

  const allImages: string[] = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    if (product.whiteBgImage) list.push(product.whiteBgImage);
    if (Array.isArray(product.realImages)) {
      for (const img of product.realImages) {
        if (img) list.push(img);
      }
    }
    return list;
  }, [product]);

  const realImages: string[] = useMemo(() => {
    if (!product || !Array.isArray(product.realImages)) return [];
    return product.realImages.filter((v: string) => Boolean(v));
  }, [product]);

  const realVideos: string[] = useMemo(() => {
    if (!product) return [];
    return Array.isArray(product.realVideos)
      ? product.realVideos.filter((v: string) => Boolean(v))
      : [];
  }, [product]);

  const fieldGroups = useMemo(
    () => (product ? groupFields(fields, product) : []),
    [fields, product],
  );

  const handlePrevImage = useCallback(() => {
    setActiveImage((prev: number) =>
      prev <= 0 ? realImages.length - 1 : prev - 1,
    );
  }, [realImages.length]);

  const handleNextImage = useCallback(() => {
    setActiveImage((prev: number) =>
      prev >= realImages.length - 1 ? 0 : prev + 1,
    );
  }, [realImages.length]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/products/water_purifier');
    }
  }, [navigate]);

  const openImageLightbox = (index: number) => {
    setActiveImage(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-gray-500 text-center">
          <p className="text-base font-medium">{error || '产品不存在'}</p>
          <p className="text-xs text-gray-400 mt-1">请检查产品 ID 是否正确</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <Button
            size="sm"
            variant="black"
            onClick={() => navigate('/products/water_purifier')}
          >
            产品列表
          </Button>
        </div>
      </div>
    );
  }

  const baseInfoItems: Array<{ label: string; value: React.ReactNode }> = [
    { label: '品牌', value: product.brand || '-' },
    { label: '产品名称', value: product.name || '-' },
    { label: '型号', value: product.model || '-' },
    {
      label: '上架年份',
      value: product.launchYear ? `${product.launchYear}款` : '-',
    },
    {
      label: '销售状态',
      value: product.isOnSale ? (
        <Badge variant="success">在售</Badge>
      ) : (
        <Badge variant="secondary">下架</Badge>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            返回
          </button>
          <div className="text-sm font-medium text-gray-900">产品详情</div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/products/${category}`)}
          >
            编辑产品
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* 主图 + 标题 + 基础信息 */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* 主图 */}
            <div className="flex flex-col">
              <div
                className={`aspect-square bg-gradient-to-b from-gray-50 to-gray-100 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden ${
                  allImages.length > 0 ? 'cursor-zoom-in' : ''
                }`}
                onClick={() => {
                  if (allImages.length > 0) {
                    setActiveImage(0);
                    setLightboxOpen(true);
                  }
                }}
              >
                {allImages.length > 0 ? (
                  <img
                    src={allImages[0]}
                    alt="产品主图"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">暂无图片</span>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="text-xs text-gray-400 mt-2">
                  共 {allImages.length} 张图片（白底图 + 实拍图）
                </div>
              )}
            </div>

            {/* 标题 + 价格 + 基础信息 */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="black">{CATEGORY_LABELS[category]}</Badge>
                {product.isOnSale ? (
                  <Badge variant="success">在售</Badge>
                ) : (
                  <Badge variant="secondary">下架</Badge>
                )}
                {product.launchYear && (
                  <Badge variant="outline">{product.launchYear}款</Badge>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {product.name || product.model || '产品名称'}
              </h1>
              {product.brand && (
                <p className="text-sm text-gray-500 mb-4">{product.brand}</p>
              )}

              {/* 价格区 */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-md p-4 mb-4">
                {product.referencePrice != null &&
                  product.referencePrice !== '' && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 mb-0.5">
                        参考价格
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        ¥{Number(product.referencePrice).toLocaleString()}
                      </div>
                    </div>
                  )}
                {product.dailyPrice != null && product.dailyPrice !== '' && (
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">
                      日常价格
                    </div>
                    <div className="text-lg font-semibold text-gray-700">
                      ¥{Number(product.dailyPrice).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* 基础信息简表 */}
              <div className="space-y-1.5">
                <div className="flex text-sm">
                  <span className="text-gray-500 w-20 flex-shrink-0">
                    品牌
                  </span>
                  <span className="text-gray-800 font-medium">
                    {product.brand || '-'}
                  </span>
                </div>
                <div className="flex text-sm">
                  <span className="text-gray-500 w-20 flex-shrink-0">
                    型号
                  </span>
                  <span className="text-gray-800 font-medium">
                    {product.model || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 参数分组卡片 */}
        {fieldGroups.length > 0 && (
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                产品参数
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {fieldGroups.map((group: FieldGroup) => (
                <div
                  key={group.key}
                  className="bg-gray-50/50 rounded-md border border-gray-100 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                      {group.icon}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {group.label}
                    </h3>
                    <span className="text-xs text-gray-400 ml-auto">
                      {group.fields.length} 项
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {group.fields.map((field: CategoryFieldConfig) => {
                      const key = String(field.key);
                      const value = product[key as keyof Product];
                      const isPrice = PRICE_KEYS.has(key);

                      return (
                        <div
                          key={key}
                          className="flex items-baseline py-1.5 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-xs text-gray-500 w-24 flex-shrink-0">
                            {field.label}
                          </div>
                          <div
                            className={cn(
                              'text-sm font-medium min-w-0 flex-1',
                              isPrice ? 'text-blue-600' : 'text-gray-800',
                            )}
                          >
                            {renderFieldValue(field, value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 实拍图缩略图区 */}
        {realImages.length > 0 && (
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">
                实拍图
              </h2>
              <span className="text-xs text-gray-400">
                {realImages.length} 张
              </span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {realImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => openImageLightbox(idx)}
                    className="aspect-square rounded-md border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <img
                      src={img}
                      alt={`实拍图 ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                点击图片查看大图
              </p>
            </div>
          </div>
        )}

        {/* 实拍视频缩略区 */}
        {realVideos.length > 0 && (
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Video className="w-4 h-4 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">
                实拍视频
              </h2>
              <span className="text-xs text-gray-400">
                {realVideos.length} 个
              </span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {realVideos.map((_url: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveVideo(idx);
                      setVideoDialogOpen(true);
                    }}
                    className="aspect-video rounded-md border border-gray-200 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center text-white/80 hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 group-hover:bg-white/30 transition-colors">
                      <Play className="w-5 h-5 ml-0.5" />
                    </div>
                    <span className="text-xs">视频 {idx + 1}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                点击视频卡片播放
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-5xl bg-transparent border-none shadow-none p-0"
          showCloseButton={false}
        >
          <div className="relative w-full">
            <DialogClose className="absolute right-0 -top-10 z-10 text-white/80 hover:text-white transition-colors">
              <X className="w-6 h-6" />
              <span className="sr-only">关闭</span>
            </DialogClose>

            <div className="flex items-center justify-center">
              {realImages.length > 1 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img
                src={realImages[activeImage]}
                alt="实拍图大图"
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {realImages.length > 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="text-center text-white/60 text-xs mt-3">
              {activeImage + 1} / {realImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent
          className="max-w-4xl bg-black border-none shadow-none p-0"
          showCloseButton={false}
        >
          <div className="relative w-full">
            <DialogClose className="absolute right-2 top-2 z-10 w-8 h-8 rounded-full bg-black/50 text-white/80 hover:text-white flex items-center justify-center">
              <X className="w-5 h-5" />
              <span className="sr-only">关闭</span>
            </DialogClose>
            <div className="aspect-video w-full">
              <video
                key={`dialog-${realVideos[activeVideo]}`}
                src={realVideos[activeVideo]}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailPage;
