import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Tag } from 'lucide-react';
import { listComboSchemes } from '@/api/combo-schemes';
import { compareProducts } from '@/api/products';
import type { ComboScheme, Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { productTitle, formatPrice } from '@/utils/format';

interface ComboWithProducts {
  scheme: ComboScheme;
  products: Product[];
}

const LiveComboPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get('ids');
  const previewIds = useMemo(
    () => (idsParam ? idsParam.split(',').filter(Boolean) : []),
    [idsParam],
  );

  const [combos, setCombos] = useState<ComboWithProducts[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadFromSchemes = async (): Promise<ComboWithProducts[]> => {
      const schemes: ComboScheme[] = await listComboSchemes();
      if (schemes.length === 0) return [];
      const result: ComboWithProducts[] = [];
      for (const s of schemes) {
        if (s.productIds && s.productIds.length > 0) {
          try {
            const prods: Product[] = await compareProducts(s.productIds);
            const ordered = s.productIds
              .map((id: string) => prods.find((p: Product) => p.id === id))
              .filter(Boolean) as Product[];
            result.push({ scheme: s, products: ordered });
          } catch {
            result.push({ scheme: s, products: [] });
          }
        } else {
          result.push({ scheme: s, products: [] });
        }
        if (cancelled) break;
      }
      return result;
    };

    const loadFromPreviewIds = async (): Promise<ComboWithProducts[]> => {
      if (previewIds.length === 0) return [];
      try {
        const prods: Product[] = await compareProducts(previewIds);
        const ordered = previewIds
          .map((id: string) => prods.find((p: Product) => p.id === id))
          .filter(Boolean) as Product[];
        return [
          {
            scheme: {
              id: 'preview',
              name: '直播预览方案',
              productIds: previewIds,
              livePrice: null,
              createdAt: '',
              updatedAt: '',
            },
            products: ordered,
          },
        ];
      } catch {
        return [];
      }
    };

    const run = async () => {
      try {
        let list: ComboWithProducts[] = [];
        if (previewIds.length > 0) {
          const preview = await loadFromPreviewIds();
          const schemes = await loadFromSchemes();
          list = [...preview, ...schemes];
        } else {
          list = await loadFromSchemes();
        }
        if (!cancelled) setCombos(list);
      } catch (err: unknown) {
        if (!cancelled) {
          console.error('加载搭配方案失败', err);
          setError('加载失败，请稍后重试');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [previewIds]);

  const currentCombo: ComboWithProducts | null = useMemo(
    () => combos[currentIndex] || null,
    [combos, currentIndex],
  );

  const totalReference = useMemo(() => {
    if (!currentCombo) return 0;
    return currentCombo.products.reduce(
      (sum: number, p: Product) => sum + (p.referencePrice ?? 0),
      0,
    );
  }, [currentCombo]);

  const totalDaily = useMemo(() => {
    if (!currentCombo) return 0;
    return currentCombo.products.reduce(
      (sum: number, p: Product) => sum + (p.dailyPrice ?? 0),
      0,
    );
  }, [currentCombo]);

  const livePrice = useMemo(() => {
    if (!currentCombo) return null;
    if (currentCombo.scheme.livePrice != null) return currentCombo.scheme.livePrice;
    if (totalDaily > 0) return totalDaily;
    return totalReference > 0 ? totalReference : null;
  }, [currentCombo, totalDaily, totalReference]);

  const savedAmount = useMemo(() => {
    if (livePrice == null || totalReference === 0) return 0;
    const diff = totalReference - livePrice;
    return diff > 0 ? diff : 0;
  }, [livePrice, totalReference]);

  const handlePrev = useCallback(() => {
    if (combos.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? combos.length - 1 : prev - 1));
  }, [combos.length]);

  const handleNext = useCallback(() => {
    if (combos.length === 0) return;
    setCurrentIndex((prev) => (prev === combos.length - 1 ? 0 : prev + 1));
  }, [combos.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white/60 text-sm">加载中...</div>
      </div>
    );
  }

  if (error || !currentCombo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-white/80 text-base mb-4">
            {error || '暂无搭配方案'}
          </div>
          <button
            onClick={() => navigate('/combo')}
            className="text-cyan-400 text-sm hover:underline"
          >
            去创建方案
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/combo')}
            className="text-white/60 text-sm flex items-center gap-1 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            返回
          </button>
          <div className="bg-black/40 backdrop-blur text-white/80 px-3 py-1 rounded-full text-xs">
            {currentIndex + 1} / {combos.length}
          </div>
        </div>

        {/* Scheme title */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="default"
              className="bg-orange-500/20 text-orange-400 border border-orange-400/30 font-medium"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              直播套装
            </Badge>
          </div>
          <h1 className="text-white text-2xl font-bold leading-tight">
            {currentCombo.scheme.name}
          </h1>
        </div>

        {/* Product cards stacked */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
          {currentCombo.products.map((p: Product, idx: number) => (
            <div
              key={p.id}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-3 flex gap-3"
            >
              <div className="relative w-20 h-20 flex-shrink-0 rounded-lg bg-white/5 overflow-hidden flex items-center justify-center">
                <div className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold rounded-br-lg z-10">
                  {idx + 1}
                </div>
                {p.whiteBgImage ? (
                  <img
                    src={p.whiteBgImage}
                    alt={productTitle(p)}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <div className="text-[10px] text-white/40">无图</div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <div className="text-white/50 text-xs">{p.brand || '未知品牌'}</div>
                <div className="text-white text-sm font-semibold truncate">
                  {productTitle(p)}
                </div>
                {p.model && (
                  <div className="text-white/40 text-xs truncate">
                    {p.model}
                  </div>
                )}
                <div className="text-cyan-300 text-sm font-bold">
                  {p.referencePrice != null
                    ? `¥${p.referencePrice.toLocaleString()}`
                    : '价格待定'}
                </div>
              </div>
            </div>
          ))}
          {currentCombo.products.length === 0 && (
            <div className="text-center text-white/40 text-sm py-10">
              此方案暂无产品
            </div>
          )}
        </div>

        {/* Price section */}
        <div className="px-6 pt-3 pb-2">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-white/60 text-sm">日常总价</span>
              {totalReference > 0 ? (
                <span className="text-white/50 text-base line-through">
                  ¥{totalReference.toLocaleString()}
                </span>
              ) : (
                <span className="text-white/30 text-sm">—</span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-white text-base font-medium flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-orange-400" />
                直播优惠价
              </span>
              {livePrice != null ? (
                <span className="text-4xl font-extrabold text-orange-500 tracking-tight">
                  ¥{livePrice.toLocaleString()}
                </span>
              ) : (
                <span className="text-xl font-bold text-white/60">价格待定</span>
              )}
            </div>
            {savedAmount > 0 && (
              <div className="mt-3 flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-400/20 rounded-lg py-2">
                <span className="text-red-400 text-sm font-medium">
                  立省 ¥{savedAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Selling points */}
        <div className="px-6 py-3">
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge
              variant="default"
              className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-normal"
            >
              全屋净水方案
            </Badge>
            <Badge
              variant="default"
              className="bg-blue-500/20 text-blue-300 border border-blue-400/30 font-normal"
            >
              品质保障
            </Badge>
            <Badge
              variant="default"
              className="bg-purple-500/20 text-purple-300 border border-purple-400/30 font-normal"
            >
              限时优惠
            </Badge>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="px-6 pb-8 pt-2 flex gap-3">
          <button
            onClick={handlePrev}
            className="flex-1 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            上一套
          </button>
          <button
            onClick={handleNext}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold flex items-center justify-center gap-2 hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/30"
          >
            下一套
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveComboPage;
