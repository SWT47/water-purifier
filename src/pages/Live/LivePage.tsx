import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Thermometer,
  Filter,
  Package,
  Waves,
  Droplet,
} from 'lucide-react';
import { getProductList } from '@/api/products';
import type { Product, ProductCategory, ProductListResult } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { Badge } from '@/components/ui/Badge';
import { productTitle, formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';

const categoryIcons: Record<ProductCategory, React.ReactNode> = {
  water_purifier: <Droplets className="w-4 h-4" />,
  pipeline_machine: <Thermometer className="w-4 h-4" />,
  pre_filter: <Filter className="w-4 h-4" />,
  big_white_bottle: <Package className="w-4 h-4" />,
  central_purifier: <Droplet className="w-4 h-4" />,
  central_softener: <Waves className="w-4 h-4" />,
};

const LivePage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const cat = (category || 'water_purifier') as ProductCategory;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [imageIndex, setImageIndex] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setImageIndex(0);
    getProductList({ category: cat, page: 1, pageSize: 100 })
      .then((resp: ProductListResult) => {
        if (cancelled) return;
        setProducts(resp.items || []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('加载产品失败', err);
        setError('加载失败，请稍后重试');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cat]);

  const currentProduct: Product | null = useMemo(() => {
    return products[currentIndex] || null;
  }, [products, currentIndex]);

  const carouselImages: string[] = useMemo(() => {
    if (!currentProduct) return [];
    const imgs: string[] = [];
    if (currentProduct.whiteBgImage) imgs.push(currentProduct.whiteBgImage);
    if (currentProduct.realImages && currentProduct.realImages.length > 0) {
      imgs.push(...currentProduct.realImages);
    }
    return imgs;
  }, [currentProduct]);

  useEffect(() => {
    setImageIndex(0);
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (products.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  }, [products.length]);

  const handleNext = useCallback(() => {
    if (products.length === 0) return;
    setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
  }, [products.length]);

  const handlePrevImage = useCallback(() => {
    if (carouselImages.length <= 1) return;
    setImageIndex((prev) =>
      prev === 0 ? carouselImages.length - 1 : prev - 1,
    );
  }, [carouselImages.length]);

  const handleNextImage = useCallback(() => {
    if (carouselImages.length <= 1) return;
    setImageIndex((prev) =>
      prev === carouselImages.length - 1 ? 0 : prev + 1,
    );
  }, [carouselImages.length]);

  const sellingPoints: string[] = useMemo(() => {
    const points: string[] = [];
    if (!currentProduct) return points;
    if (currentProduct.hasMaternityCert) points.push('母婴认证');
    if (currentProduct.hasZeroStagnantWater) points.push('0陈水');
    if (currentProduct.roMembraneBrand) points.push(currentProduct.roMembraneBrand + ' RO膜');
    if (currentProduct.flux) points.push(currentProduct.flux + ' 通量');
    if (currentProduct.waterMode) points.push(currentProduct.waterMode);
    if (currentProduct.activatedCarbon) points.push(currentProduct.activatedCarbon);
    if (currentProduct.faucet) points.push(currentProduct.faucet);
    return points.slice(0, 6);
  }, [currentProduct]);

  const keyParams: Array<{ label: string; value: string | number | null }> = useMemo(() => {
    if (!currentProduct) return [];
    return [
      { label: '通量', value: currentProduct.flux },
      { label: '水流量', value: currentProduct.waterFlowRate },
      { label: 'RO膜品牌', value: currentProduct.roMembraneBrand },
      { label: '滤芯年费用', value: currentProduct.filterTotalCost ? formatPrice(currentProduct.filterTotalCost) : null },
      { label: '出水模式', value: currentProduct.waterMode },
      { label: '尺寸', value: currentProduct.dimensions },
    ].filter((p) => p.value != null && p.value !== '');
  }, [currentProduct]);

  const livePrice: number | null = useMemo(() => {
    if (!currentProduct) return null;
    return currentProduct.dailyPrice ?? currentProduct.referencePrice ?? null;
  }, [currentProduct]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white/60 text-sm">加载中...</div>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-white/80 text-base mb-4">
            {error || '该类目暂无产品'}
          </div>
          <button
            onClick={() => navigate('/products/water_purifier')}
            className="text-cyan-400 text-sm hover:underline"
          >
            返回产品库
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative">
        {/* Top left: category + back */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/products/water_purifier')}
            className="flex items-center gap-1.5 bg-black/40 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs"
          >
            {categoryIcons[cat]}
            <span>{CATEGORY_LABELS[cat]}</span>
          </button>
          <div className="bg-black/40 backdrop-blur text-white/80 px-3 py-1.5 rounded-full text-xs">
            {currentIndex + 1} / {products.length}
          </div>
        </div>

        {/* Top: product name + price */}
        <div className="pt-16 px-6 pb-4">
          <div className="text-white/60 text-xs mb-1">
            {currentProduct.brand || '未知品牌'}
          </div>
          <h1 className="text-white text-2xl font-bold leading-tight mb-1">
            {productTitle(currentProduct)}
          </h1>
          {currentProduct.model && (
            <div className="text-white/50 text-sm mb-3">
              型号：{currentProduct.model}
            </div>
          )}
          <div className="flex items-baseline gap-3">
            <span className="text-xs text-white/50">直播价</span>
            {livePrice != null ? (
              <span className="text-4xl font-extrabold text-orange-500 tracking-tight">
                ¥{livePrice.toLocaleString()}
              </span>
            ) : (
              <span className="text-2xl font-bold text-white/60">价格待定</span>
            )}
            {currentProduct.referencePrice != null &&
              livePrice != null &&
              currentProduct.referencePrice > livePrice && (
                <span className="text-sm text-white/40 line-through">
                  ¥{currentProduct.referencePrice.toLocaleString()}
                </span>
              )}
          </div>
        </div>

        {/* Middle: image carousel */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-2">
          {carouselImages.length > 0 ? (
            <div className="relative w-full aspect-square max-w-[320px] mx-auto">
              <div className="w-full h-full rounded-xl bg-white/10 backdrop-blur border border-white/20 overflow-hidden flex items-center justify-center">
                <img
                  src={carouselImages[imageIndex]}
                  alt={productTitle(currentProduct)}
                  className="w-full h-full object-contain p-4"
                />
              </div>
              {carouselImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {carouselImages.map((_, idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          'h-1.5 rounded-full transition-all',
                          idx === imageIndex
                            ? 'w-5 bg-white'
                            : 'w-1.5 bg-white/40',
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full aspect-square max-w-[320px] mx-auto rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white/40 text-sm">
              暂无图片
            </div>
          )}
        </div>

        {/* Selling points */}
        {sellingPoints.length > 0 && (
          <div className="px-6 pb-3">
            <div className="flex flex-wrap gap-2">
              {sellingPoints.map((point: string, idx: number) => (
                <Badge
                  key={idx}
                  variant="default"
                  className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-normal"
                >
                  {point}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key params table */}
        {keyParams.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              {keyParams.map((p, idx: number) => (
                <div
                  key={p.label}
                  className={cn(
                    'flex items-center justify-between px-4 py-2.5',
                    idx < keyParams.length - 1 && 'border-b border-white/5',
                  )}
                >
                  <span className="text-white/60 text-sm">{p.label}</span>
                  <span className="text-white text-sm font-medium">
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom: prev / next buttons */}
        <div className="px-6 pb-8 pt-2 flex gap-3">
          <button
            onClick={handlePrev}
            className="flex-1 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            上一款
          </button>
          <button
            onClick={handleNext}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold flex items-center justify-center gap-2 hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/30"
          >
            下一款
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LivePage;
