import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  X,
  Home,
  FolderOpen,
} from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { getProductList, compareProducts } from '@client/src/api/products';
import { comboSchemes } from '@client/src/api';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  Product,
  ProductCategory,
  ProductListResult,
  ComboScheme,
} from '@shared/api.interface';
import {
  CATEGORY_LABELS,
} from '@client/src/utils/categories';
import ProductDetailModal from '@client/src/pages/Products/ProductDetailModal';

const ALL_CATEGORIES: ProductCategory[] = [
  'water_purifier',
  'pipeline_machine',
  'pre_filter',
  'big_white_bottle',
  'central_purifier',
  'central_softener',
];

const MAX_ITEMS = 5;

const productTitle = (p: Product): string =>
  p.name ? `${p.name}${p.model ? ' ' + p.model : ''}` : p.model || '产品名称';

const LiveComboPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const idsParam = searchParams.get('ids') || '';
  const initialIds = idsParam ? idsParam.split(',').filter(Boolean) : [];

  const [activeCategory, setActiveCategory] = useState<ProductCategory>('water_purifier');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(initialIds.length > 0);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [livePrice, setLivePrice] = useState<string>('');
  const [schemeDialogOpen, setSchemeDialogOpen] = useState<boolean>(false);
  const [schemes, setSchemes] = useState<ComboScheme[]>([]);
  const [schemesLoading, setSchemesLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialIds.length === 0) return;
    let cancelled = false;
    compareProducts(initialIds)
      .then((resp) => {
        if (cancelled) return;
        const list = (resp.data as Product[]).filter(Boolean);
        setSelectedProducts(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        logger.error('直播搭配页加载初始产品失败', err);
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProductList({ category: activeCategory, page: 1, pageSize: 50 })
      .then((resp) => {
        if (cancelled) return;
        const data = resp.data as ProductListResult;
        setProducts(data.items || []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        logger.error('直播搭配页加载产品失败', err);
        setError('加载失败，请稍后重试');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const selectedIds = useMemo(
    () => new Set(selectedProducts.map((p: Product) => p.id)),
    [selectedProducts],
  );

  const handleAdd = (product: Product) => {
    if (selectedIds.has(product.id)) {
      setSelectedProducts(selectedProducts.filter((p: Product) => p.id !== product.id));
      return;
    }
    if (selectedProducts.length >= MAX_ITEMS) return;
    setSelectedProducts([...selectedProducts, product]);
  };

  const handleRemove = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p: Product) => p.id !== id));
  };

  const handleClear = () => {
    setSelectedProducts([]);
  };

  const handleOpenDetail = (p: Product) => {
    setDetailProduct(p);
    setDetailOpen(true);
  };

  const totalReference = selectedProducts.reduce(
    (sum: number, p: Product) => sum + (p.referencePrice ?? 0),
    0,
  );
  const totalDaily = selectedProducts.reduce(
    (sum: number, p: Product) => sum + (p.dailyPrice ?? 0),
    0,
  );
  const hasDaily = selectedProducts.some((p: Product) => p.dailyPrice != null);
  const hasReference = selectedProducts.some((p: Product) => p.referencePrice != null);
  const diff = totalReference - totalDaily;
  const showDiff = hasDaily && hasReference && diff > 0;

  const livePriceNum = useMemo(() => {
    const n = parseFloat(livePrice);
    return isNaN(n) || n < 0 ? null : n;
  }, [livePrice]);

  const liveDiscount = useMemo(() => {
    if (livePriceNum === null) return null;
    const base = totalReference || totalDaily;
    if (!base) return null;
    return base - livePriceNum;
  }, [livePriceNum, totalReference, totalDaily]);

  const updateUrl = (list: Product[]) => {
    const ids = list.map((p: Product) => p.id).join(',');
    if (ids) {
      searchParams.set('ids', ids);
      setSearchParams(searchParams, { replace: true });
    }
  };

  const loadSchemes = () => {
    setSchemesLoading(true);
    comboSchemes
      .listComboSchemes()
      .then((resp) => {
        setSchemes(resp.data || []);
      })
      .catch((err: unknown) => {
        logger.error('加载方案列表失败', err);
      })
      .finally(() => {
        setSchemesLoading(false);
      });
  };

  const handleLoadScheme = async (scheme: ComboScheme) => {
    if (!scheme.productIds || scheme.productIds.length === 0) {
      setSelectedProducts([]);
      setSchemeDialogOpen(false);
      return;
    }
    try {
      const resp = await compareProducts(scheme.productIds);
      const list = (resp.data as Product[]).filter(Boolean);
      const ordered = scheme.productIds
        .map((id: string) => list.find((p: Product) => p.id === id))
        .filter(Boolean) as Product[];
      setSelectedProducts(ordered);
      if (scheme.livePrice != null) {
        setLivePrice(String(scheme.livePrice));
      } else {
        setLivePrice('');
      }
      const ids = ordered.map((p: Product) => p.id).join(',');
      if (ids) {
        searchParams.set('ids', ids);
        setSearchParams(searchParams, { replace: true });
      }
      setSchemeDialogOpen(false);
    } catch (err: unknown) {
      logger.error('加载方案失败', err);
    }
  };

  if (initialLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  const hasSelection = selectedProducts.length > 0;

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 relative">
      <div className="h-12 bg-black text-white flex items-center justify-between px-4 text-sm font-medium flex-shrink-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-white/80 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>
        <span className="font-medium">产品搭配方案</span>
        <button
          onClick={() => {
            loadSchemes();
            setSchemeDialogOpen(true);
          }}
          className="flex items-center gap-1.5 text-white/80 hover:text-white"
        >
          <FolderOpen className="w-4 h-4" />
          方案
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {hasSelection ? (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-2">
            {selectedProducts.map((p: Product, idx: number) => (
              <div
                key={p.id}
                onClick={() => handleOpenDetail(p)}
                className="relative bg-white rounded-[10px] overflow-hidden shadow-[0_4px_16px_rgba(0_0_0_0.06)] border-2 border-transparent cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0_0_0_0.1)] hover:border-cyan-400 active:scale-[0.99]"
                data-ai-section-type="card-list"
              >
                <div className="absolute top-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs px-3 py-1 font-bold rounded-br-[10px] z-10">
                  第{idx + 1}件 · {CATEGORY_LABELS[p.category]}
                </div>
                <button
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    const next = selectedProducts.filter((x: Product) => x.id !== p.id);
                    setSelectedProducts(next);
                    updateUrl(next);
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-stretch">
                  <div className="w-32 flex-shrink-0 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-3">
                    {p.whiteBgImage ? (
                      <Image
                        src={p.whiteBgImage}
                        alt={productTitle(p)}
                        className="w-full h-28 object-contain"
                        width={120}
                        height={112}
                      />
                    ) : (
                      <div className="text-xs text-gray-400">暂无图片</div>
                    )}
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-center gap-1.5 pr-8">
                    <span className="text-xs text-gray-500">{p.brand || '未知品牌'}</span>
                    <h3 className="text-base font-semibold text-gray-900 leading-tight line-clamp-2">
                      {productTitle(p)}
                    </h3>
                    {p.referencePrice != null && (
                      <div className="text-lg font-bold text-blue-600 mt-1">
                        ¥{p.referencePrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="h-2" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-shrink-0 overflow-x-auto bg-white border-b border-gray-200">
              <div className="flex px-3 py-2 gap-1">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={[
                      'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      activeCategory === cat
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    ].join(' ')}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="text-center py-16 text-gray-400 text-sm">加载中...</div>
              ) : error ? (
                <div className="text-center py-16 text-red-500 text-sm">{error}</div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">该类目暂无产品</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {products.map((p: Product) => {
                    const isSelected = selectedIds.has(p.id);
                    const reachMax = !isSelected && selectedProducts.length >= MAX_ITEMS;
                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0_0_0_0.06)] border border-transparent flex flex-col"
                        onClick={() => {
                          if (reachMax) return;
                          handleAdd(p);
                        }}
                      >
                        <div className="h-28 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                          {p.whiteBgImage ? (
                            <Image
                              src={p.whiteBgImage}
                              alt={productTitle(p)}
                              className="w-full h-full object-contain p-2"
                              width={120}
                              height={112}
                            />
                          ) : (
                            <div className="text-xs text-gray-400">暂无图片</div>
                          )}
                        </div>
                        <div className="p-2 flex flex-col gap-0.5">
                          <span className="text-[10px] text-gray-500 truncate">
                            {p.brand || '未知品牌'}
                          </span>
                          <h4 className="text-xs font-semibold text-gray-900 leading-tight truncate">
                            {productTitle(p)}
                          </h4>
                          {p.referencePrice != null && (
                            <span className="text-xs font-bold text-blue-600 mt-0.5">
                              ¥{p.referencePrice.toLocaleString()}
                            </span>
                          )}
                          <button
                            className={[
                              'mt-1 text-[11px] py-1 rounded font-medium',
                              isSelected
                                ? 'bg-cyan-50 text-cyan-600 border border-cyan-300'
                                : reachMax
                                ? 'bg-gray-100 text-gray-400'
                                : 'text-white',
                            ].join(' ')}
                            style={!isSelected && !reachMax ? { backgroundColor: '#06B6D4' } : undefined}
                            disabled={reachMax}
                          >
                            {isSelected ? '已加入' : reachMax ? '已达上限' : '加入搭配'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 底部总价区 + 直播优惠价 */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-2px_12px_rgba(0_0_0_0.06)]">
          {hasSelection ? (
            <div className="space-y-2.5">
              {hasReference && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">参考总价</span>
                  <span className="font-medium text-gray-600">
                    ¥{totalReference.toLocaleString()}
                  </span>
                </div>
              )}
              {showDiff && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">日常总价</span>
                  <span className="font-medium text-gray-500 line-through">
                    ¥{totalDaily.toLocaleString()}
                  </span>
                </div>
              )}

              {/* 直播优惠价输入 */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-[8px] p-3 border border-red-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-600">
                    🔥 直播专属优惠价
                  </span>
                  {livePriceNum !== null && liveDiscount !== null && liveDiscount > 0 && (
                    <span className="text-xs font-bold text-red-500">
                      立省 ¥{liveDiscount.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-500">¥</span>
                  <input
                    type="number"
                    value={livePrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLivePrice(e.target.value)
                    }
                    placeholder="请输入直播优惠价"
                    className="flex-1 h-10 px-3 text-xl font-bold text-red-600 bg-white border-2 border-red-200 rounded-[6px] focus:outline-none focus:border-red-400 placeholder:text-sm placeholder:font-normal placeholder:text-gray-400"
                  />
                </div>
              </div>

              {livePriceNum !== null && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-sm text-gray-700 font-medium">
                    直播优惠总价
                  </span>
                  <span className="text-2xl font-bold text-red-500">
                    ¥{livePriceNum.toLocaleString()}
                  </span>
                </div>
              )}

              {!livePrice && hasReference && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-sm text-gray-700 font-medium">
                    搭配总价（{selectedProducts.length}件）
                  </span>
                  <span className="text-2xl font-bold" style={{ color: '#2563EB' }}>
                    ¥{totalReference.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  className="flex-1 py-2 text-xs font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  onClick={handleClear}
                >
                  清空重选
                </button>
                <button
                  className="flex-1 py-2 text-xs font-medium rounded text-white transition-colors"
                  style={{ backgroundColor: '#06B6D4' }}
                  onClick={() => {
                    setSelectedProducts([]);
                    updateUrl([]);
                  }}
                >
                  继续添加
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-3">
              选择产品后显示搭配总价
            </div>
          )}
        </div>
      </div>

      {/* 左下角首页按钮 */}
      <button
        onClick={() => navigate('/products/water_purifier')}
        className="absolute bottom-20 left-3 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors shadow-lg"
        title="返回首页"
      >
        <Home className="w-4 h-4" />
      </button>

      {/* 方案选择弹窗 */}
      <Dialog open={schemeDialogOpen} onOpenChange={setSchemeDialogOpen}>
        <DialogContent className="max-w-lg max-h-[75vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>选择搭配方案</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-2">
            {schemesLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
            ) : schemes.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                暂无保存的方案
              </div>
            ) : (
              <div className="space-y-2">
                {schemes.map((s: ComboScheme) => (
                  <button
                    key={s.id}
                    className="w-full text-left flex items-center gap-3 p-3 border border-gray-200 rounded-[6px] hover:border-cyan-300 hover:bg-cyan-50/30 transition-colors"
                    onClick={() => handleLoadScheme(s)}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {s.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{s.productIds?.length || 0} 款产品</span>
                        <span>
                          {new Date(s.updatedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSchemeDialogOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 产品详情弹窗 */}
      {detailProduct && (
        <ProductDetailModal
          open={detailOpen}
          product={detailProduct}
          category={detailProduct.category}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
};

export default LiveComboPage;
