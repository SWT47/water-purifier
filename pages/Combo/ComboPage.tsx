import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets,
  Thermometer,
  Filter,
  Package,
  Droplet,
  Waves,
  Plus,
  X,
  Save,
  FolderOpen,
  Trash2,
  Smartphone,
  Tag,
  Home,
  RotateCcw,
} from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
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

const CATEGORY_ICONS: Record<ProductCategory, React.ReactNode> = {
  water_purifier: <Droplets className="w-4 h-4" />,
  pipeline_machine: <Thermometer className="w-4 h-4" />,
  pre_filter: <Filter className="w-4 h-4" />,
  big_white_bottle: <Package className="w-4 h-4" />,
  central_purifier: <Droplet className="w-4 h-4" />,
  central_softener: <Waves className="w-4 h-4" />,
};

const ALL_CATEGORIES: ProductCategory[] = [
  'water_purifier',
  'pipeline_machine',
  'pre_filter',
  'big_white_bottle',
  'central_purifier',
  'central_softener',
];

const MAX_ITEMS = 5;

const formatPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '价格待定';
  return `¥${value.toLocaleString()}`;
};

const ComboPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('water_purifier');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [schemes, setSchemes] = useState<ComboScheme[]>([]);
  const [schemesLoading, setSchemesLoading] = useState<boolean>(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [schemeDialogOpen, setSchemeDialogOpen] = useState<boolean>(false);
  const [schemeName, setSchemeName] = useState<string>('');
  const [saveMode, setSaveMode] = useState<'new' | 'overwrite'>('new');
  const [currentSchemeId, setCurrentSchemeId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [livePrice, setLivePrice] = useState<string>('');

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
        logger.error('搭配页加载产品失败', err);
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

  useEffect(() => {
    loadSchemes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = (product: Product) => {
    if (selectedIds.has(product.id)) return;
    if (selectedProducts.length >= MAX_ITEMS) return;
    setSelectedProducts([...selectedProducts, product]);
  };

  const handleRemove = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p: Product) => p.id !== id));
  };

  const handleClear = () => {
    setSelectedProducts([]);
    setCurrentSchemeId(null);
    setSchemeName('');
  };

  const handleSaveAs = () => {
    setSchemeName('');
    setSaveMode('new');
    setSaveDialogOpen(true);
  };

  const handleOverwrite = () => {
    if (!currentSchemeId) return;
    setSaveMode('overwrite');
    setSchemeDialogOpen(true);
  };

  const confirmSave = async () => {
    if (!schemeName.trim() || selectedProducts.length === 0) return;
    setSaving(true);
    try {
      if (saveMode === 'new') {
        await comboSchemes.createComboScheme({
          name: schemeName.trim(),
          productIds: selectedProducts.map((p: Product) => p.id),
        });
      } else if (saveMode === 'overwrite' && currentSchemeId) {
        await comboSchemes.updateComboScheme(currentSchemeId, {
          name: schemeName.trim(),
          productIds: selectedProducts.map((p: Product) => p.id),
        });
      }
      setSaveDialogOpen(false);
      setSchemeDialogOpen(false);
      loadSchemes();
    } catch (err: unknown) {
      logger.error('保存方案失败', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadScheme = async (scheme: ComboScheme) => {
    if (!scheme.productIds || scheme.productIds.length === 0) {
      setSelectedProducts([]);
      setCurrentSchemeId(scheme.id);
      setSchemeName(scheme.name);
      return;
    }
    try {
      const resp = await compareProducts(scheme.productIds);
      const list = (resp.data as Product[]).filter(Boolean);
      const ordered = scheme.productIds
        .map((id: string) => list.find((p: Product) => p.id === id))
        .filter(Boolean) as Product[];
      setSelectedProducts(ordered);
      setCurrentSchemeId(scheme.id);
      setSchemeName(scheme.name);
    } catch (err: unknown) {
      logger.error('加载方案失败', err);
    }
  };

  const handleDeleteScheme = async (id: string) => {
    try {
      await comboSchemes.deleteComboScheme(id);
      if (currentSchemeId === id) {
        setCurrentSchemeId(null);
        setSchemeName('');
      }
      loadSchemes();
    } catch (err: unknown) {
      logger.error('删除方案失败', err);
    }
  };

  const totalDaily = selectedProducts.reduce(
    (sum: number, p: Product) => sum + (p.dailyPrice ?? 0),
    0,
  );
  const totalReference = selectedProducts.reduce(
    (sum: number, p: Product) => sum + (p.referencePrice ?? 0),
    0,
  );
  const livePriceNum = Number(livePrice) || 0;
  const hasLivePrice = livePriceNum > 0;
  const savings = totalReference - livePriceNum;
  const hasSavings = hasLivePrice && savings > 0;
  const hasDaily = selectedProducts.some((p: Product) => p.dailyPrice != null);
  const hasReference = selectedProducts.some((p: Product) => p.referencePrice != null);
  const diff = totalReference - totalDaily;
  const showDiff = hasDaily && hasReference && diff > 0;

  const productTitle = (p: Product): string =>
    p.name ? `${p.name}${p.model ? ' ' + p.model : ''}` : p.model || '产品名称';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部操作栏 */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products/water_purifier')}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-cyan-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            首页
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-base font-semibold text-gray-900">产品搭配方案</h1>
        </div>
         <div className="text-sm text-gray-500 flex items-center gap-3">
           <Button
             variant="outline"
             size="sm"
             className="h-8 text-xs"
             onClick={() => setSchemeDialogOpen(true)}
           >
             <FolderOpen className="w-3.5 h-3.5 mr-1" />
             我的方案
           </Button>
           <span>跨类目自由搭配 · 最高 {MAX_ITEMS} 款</span>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[180px] flex-shrink-0 bg-white border-r border-gray-200 py-3">
          <div className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            选择类目
          </div>
          <nav>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={[
                  'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left',
                   activeCategory === cat
                     ? 'bg-black text-white font-medium'
                     : 'text-gray-700 hover:bg-gray-100',
                ].join(' ')}
              >
                {CATEGORY_ICONS[cat]}
                <span>{CATEGORY_LABELS[cat]}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {CATEGORY_LABELS[activeCategory]}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                共 {products.length} 款产品 · 已选 {selectedProducts.length}/{MAX_ITEMS}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-20 text-gray-400 text-sm">加载中...</div>
            ) : error ? (
              <div className="text-center py-20 text-red-500 text-sm">{error}</div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                该类目暂无产品
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {products.map((p: Product) => {
                  const isSelected = selectedIds.has(p.id);
                  const reachMax = !isSelected && selectedProducts.length >= MAX_ITEMS;
                  return (
                    <div
                      key={p.id}
                      className={[
                        'bg-white rounded-[6px] overflow-hidden flex flex-col',
                        'shadow-[0_1px_3px_rgba(0_0_0_0.06),0_2px_8px_rgba(0_0_0_0.04)]',
                        'transition-all duration-200',
                        'border',
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/30'
                          : 'border-transparent hover:-translate-y-0.5 hover:shadow-lg',
                      ].join(' ')}
                      data-ai-section-type="card-list"
                    >
                      <div className="relative w-full h-40 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
                        {p.whiteBgImage ? (
                          <Image
                            src={p.whiteBgImage}
                            alt={productTitle(p)}
                            className="w-full h-full object-contain p-3"
                            width={200}
                            height={160}
                          />
                        ) : (
                          <div className="text-gray-400 text-xs">暂无图片</div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            已加入
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col gap-1.5">
                        <span className="text-[11px] text-gray-500">
                          {p.brand || '未知品牌'}
                        </span>
                        <h3
                          className="text-sm font-semibold text-gray-900 leading-tight truncate"
                          title={productTitle(p)}
                        >
                          {productTitle(p)}
                        </h3>
                        {p.referencePrice != null && (
                          <div className="text-sm font-bold text-blue-600 mt-auto">
                            ¥{p.referencePrice.toLocaleString()}
                          </div>
                        )}
                         <Button
                           size="sm"
                           variant={isSelected ? 'outline' : 'default'}
                           className={[
                             'w-full text-xs mt-1 h-8',
                             isSelected ? 'border-gray-400 text-gray-700' : 'bg-black hover:bg-gray-800 text-white',
                           ].join(' ')}
                           disabled={reachMax}
                           onClick={() => {
                             if (isSelected) {
                               handleRemove(p.id);
                             } else {
                               handleAdd(p);
                             }
                           }}
                         >
                          {isSelected ? (
                            <>
                              <X className="w-3.5 h-3.5 mr-1" />
                              移除
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              {reachMax ? '已达上限' : '加入搭配'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="w-[360px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
           <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
             <div>
               <h2 className="text-base font-semibold text-gray-900">搭配方案</h2>
               <p className="text-xs text-gray-500 mt-0.5">
                 已选 {selectedProducts.length}/{MAX_ITEMS} 款
                 {currentSchemeId && (
                    <span className="ml-2 text-blue-600">· {schemeName}</span>
                  )}
               </p>
             </div>
             <div className="flex gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 className="text-xs h-8 text-gray-600"
                 disabled={selectedProducts.length === 0}
                 onClick={handleClear}
               >
                 <RotateCcw className="w-3.5 h-3.5 mr-1" />
                 清空
               </Button>
             </div>
           </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                <Tag className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">还没有选择产品</p>
                <p className="text-xs mt-1">从左侧点击「加入搭配」开始</p>
              </div>
            ) : (
              selectedProducts.map((p: Product, idx: number) => (
                <div
                  key={p.id}
                  className="flex gap-3 p-2.5 rounded-[6px] bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-[6px] overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
                     <div className="absolute top-0 left-0 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center font-bold rounded-bl-[6px]">
                      {idx + 1}
                    </div>
                    {p.whiteBgImage ? (
                      <Image
                        src={p.whiteBgImage}
                        alt={productTitle(p)}
                        className="w-full h-full object-contain p-1"
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="text-[10px] text-gray-400">无图</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                     <span className="text-[10px] text-blue-600 font-medium">
                      {CATEGORY_LABELS[p.category]}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {p.brand || '未知品牌'}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 leading-tight truncate">
                      {productTitle(p)}
                    </h4>
                    {p.referencePrice != null && (
                      <span className="text-sm font-bold text-blue-600">
                        ¥{p.referencePrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    className="self-start p-1 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => handleRemove(p.id)}
                    title="移除"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

           <div className="border-t border-gray-200 p-4 bg-white space-y-3">
              {selectedProducts.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">参考总价</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(totalReference)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2.5 rounded-md">
                    <span className="text-sm text-gray-600 flex-shrink-0">直播优惠价</span>
                    <span className="text-blue-600 font-semibold text-base">¥</span>
                    <Input
                      type="number"
                      value={livePrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLivePrice(e.target.value)
                      }
                      placeholder="输入直播价"
                      className="h-8 text-base font-bold text-blue-600 bg-transparent border-0 border-b border-gray-300 rounded-none focus-visible:ring-0 focus-visible:border-blue-500 px-1 py-0"
                    />
                  </div>

                  {hasSavings && (
                    <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 px-3 py-2 rounded-md border border-red-100">
                      <span className="text-sm text-red-600 font-medium">
                        立省
                      </span>
                      <span className="text-lg font-bold text-red-600">
                        ¥{savings.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9"
                      disabled={selectedProducts.length === 0}
                      onClick={handleSaveAs}
                    >
                      <Save className="w-3.5 h-3.5 mr-1" />
                      保存方案
                    </Button>
                    {currentSchemeId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-9"
                        disabled={selectedProducts.length === 0}
                        onClick={handleOverwrite}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        覆盖保存
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="text-xs h-9"
                        style={{ backgroundColor: '#000000' }}
                        disabled={selectedProducts.length === 0}
                        onClick={() => {
                          const ids = selectedProducts
                            .map((p: Product) => p.id)
                            .join(',');
                          navigate(`/live-combo?ids=${encodeURIComponent(ids)}`);
                        }}
                      >
                        <Smartphone className="w-3.5 h-3.5 mr-1" />
                        直播展示
                      </Button>
                    )}
                  </div>
                  {currentSchemeId && (
                    <Button
                      className="w-full h-9"
                      style={{ backgroundColor: '#000000' }}
                      disabled={selectedProducts.length === 0}
                      onClick={() => {
                        const ids = selectedProducts
                          .map((p: Product) => p.id)
                          .join(',');
                        navigate(`/live-combo?ids=${encodeURIComponent(ids)}`);
                      }}
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      直播展示搭配方案
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-400 text-sm py-2">
                  选择产品后显示总价
                </div>
              )}
            </div>
        </aside>
      </div>
    </div>
  );
};

export default ComboPage;
