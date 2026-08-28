import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, X, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getProductList, compareProducts } from '@/api/products';
import {
  createComboScheme,
  updateComboScheme,
  deleteComboScheme,
  listComboSchemes,
} from '@/api/combo-schemes';
import type {
  Product,
  ProductCategory,
  ComboScheme,
  ProductListResult,
} from '@/types';
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/utils/constants';
import { productTitle } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import SortableProductList from './SortableProductList';
import ComboRightPanel from './ComboRightPanel';

const MAX_ITEMS = 5;

const ComboPage: React.FC = () => {
  const navigate = useNavigate();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const modifiers = [restrictToVerticalAxis];

  const [activeCategory, setActiveCategory] = useState<ProductCategory>('water_purifier');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [schemeName, setSchemeName] = useState<string>('');
  const [livePrice, setLivePrice] = useState<string>('');
  const [currentSchemeId, setCurrentSchemeId] = useState<string | null>(null);
  const [schemes, setSchemes] = useState<ComboScheme[]>([]);
  const [schemeDialogOpen, setSchemeDialogOpen] = useState<boolean>(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);

  // Load products
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProductList({ category: activeCategory, page: 1, pageSize: 100 })
      .then((resp: ProductListResult) => {
        if (cancelled) return;
        setProducts(resp.items || []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('加载产品列表失败', err);
        setError('加载失败，请稍后重试');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const loadSchemes = useCallback(() => {
    listComboSchemes()
      .then((list: ComboScheme[]) => {
        setSchemes(list);
      })
      .catch((err: unknown) => {
        console.error('加载方案列表失败', err);
        toast.error('加载方案列表失败');
      });
  }, []);

  const selectedIds = useMemo(
    () => new Set(selectedProducts.map((p: Product) => p.id)),
    [selectedProducts],
  );

  const totalReference = useMemo(
    () =>
      selectedProducts.reduce(
        (sum: number, p: Product) =>
          sum + (p.referencePrice != null ? Number(p.referencePrice) : 0),
        0,
      ),
    [selectedProducts],
  );
  const totalDaily = useMemo(
    () =>
      selectedProducts.reduce(
        (sum: number, p: Product) =>
          sum + (p.dailyPrice != null ? Number(p.dailyPrice) : 0),
        0,
      ),
    [selectedProducts],
  );
  const hasDaily = selectedProducts.some(
    (p: Product) => p.dailyPrice != null,
  );
  const hasReference = selectedProducts.some(
    (p: Product) => p.referencePrice != null,
  );
  const diff = totalReference - totalDaily;
  const showDiff = hasDaily && hasReference && diff > 0;

  const livePriceNum = useMemo(() => {
    const n = parseFloat(livePrice);
    return isNaN(n) || n < 0 ? null : n;
  }, [livePrice]);

  const handleAdd = useCallback(
    (product: Product) => {
      if (selectedProducts.length >= MAX_ITEMS) return;
      setSelectedProducts([...selectedProducts, product]);
    },
    [selectedProducts],
  );

  const handleRemove = useCallback(
    (id: string) => {
      setSelectedProducts(selectedProducts.filter((p: Product) => p.id !== id));
    },
    [selectedProducts],
  );

  const handleClear = useCallback(() => {
    setSelectedProducts([]);
    setSchemeName('');
    setLivePrice('');
    setCurrentSchemeId(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = selectedProducts.findIndex(
        (p: Product) => p.id === String(active.id),
      );
      const newIndex = selectedProducts.findIndex(
        (p: Product) => p.id === String(over.id),
      );
      if (oldIndex < 0 || newIndex < 0) return;
      setSelectedProducts(arrayMove(selectedProducts, oldIndex, newIndex));
    },
    [selectedProducts],
  );

  const handleSaveAs = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);

  const handleConfirmSave = useCallback(async () => {
    if (!schemeName.trim()) {
      toast.error('请输入方案名称');
      return;
    }
    try {
      const scheme = await createComboScheme({
        name: schemeName.trim(),
        productIds: selectedProducts.map((p: Product) => p.id),
        livePrice: livePriceNum ?? undefined,
      });
      setCurrentSchemeId(scheme.id);
      setSaveDialogOpen(false);
      toast.success('方案保存成功');
      loadSchemes();
    } catch (err: unknown) {
      console.error('保存方案失败', err);
      toast.error('保存失败');
    }
  }, [schemeName, selectedProducts, livePriceNum, loadSchemes]);

  const handleOverwrite = useCallback(async () => {
    if (!currentSchemeId) return;
    try {
      await updateComboScheme(currentSchemeId, {
        name: schemeName.trim() || undefined,
        productIds: selectedProducts.map((p: Product) => p.id),
        livePrice: livePriceNum,
      });
      toast.success('方案已更新');
      loadSchemes();
    } catch (err: unknown) {
      console.error('更新方案失败', err);
      toast.error('更新失败');
    }
  }, [currentSchemeId, schemeName, selectedProducts, livePriceNum, loadSchemes]);

  const handleDeleteScheme = useCallback(async (id: string) => {
    if (!confirm('确定要删除此方案吗？')) return;
    try {
      await deleteComboScheme(id);
      setSchemes((prev) => prev.filter((s: ComboScheme) => s.id !== id));
      if (currentSchemeId === id) {
        setCurrentSchemeId(null);
      }
      toast.success('方案已删除');
    } catch (err: unknown) {
      console.error('删除方案失败', err);
      toast.error('删除失败');
    }
  }, [currentSchemeId]);

  const handleLoadScheme = useCallback(
    async (scheme: ComboScheme) => {
      if (!scheme.productIds || scheme.productIds.length === 0) {
        setSelectedProducts([]);
        setSchemeName(scheme.name);
        setCurrentSchemeId(scheme.id);
        setLivePrice(scheme.livePrice != null ? String(scheme.livePrice) : '');
        setSchemeDialogOpen(false);
        return;
      }
      try {
        const list = await compareProducts(scheme.productIds);
        const ordered = scheme.productIds
          .map((id: string) => list.find((p: Product) => p.id === id))
          .filter(Boolean) as Product[];
        setSelectedProducts(ordered);
        setSchemeName(scheme.name);
        setCurrentSchemeId(scheme.id);
        setLivePrice(scheme.livePrice != null ? String(scheme.livePrice) : '');
        setSchemeDialogOpen(false);
        toast.success('方案已加载');
      } catch (err: unknown) {
        console.error('加载方案失败', err);
        toast.error('加载方案失败');
      }
    },
    [],
  );

  const handleOpenSchemes = useCallback(() => {
    loadSchemes();
    setSchemeDialogOpen(true);
  }, [loadSchemes]);

  const handleLivePreview = useCallback(() => {
    const ids = selectedProducts.map((p: Product) => p.id).join(',');
    navigate(`/live-combo?ids=${encodeURIComponent(ids)}`);
  }, [selectedProducts, navigate]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="h-12 bg-black text-white flex items-center justify-between px-6 flex-shrink-0">
        <button
          onClick={() => navigate('/products/water_purifier')}
          className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          返回产品库
        </button>
        <h1 className="text-sm font-semibold">搭配方案编辑</h1>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: products */}
        <section className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 bg-white">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 overflow-x-auto">
              {ALL_CATEGORIES.map((cat: ProductCategory) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    activeCategory === cat
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                加载中...
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500 text-sm">
                {error}
              </div>
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
                      className={cn(
                        'bg-white rounded-md overflow-hidden flex flex-col border transition-all duration-200 shadow-card-sm',
                        isSelected
                          ? 'border-blue-500 bg-blue-50/30'
                          : 'border-gray-200 hover:-translate-y-0.5 hover:shadow-card-md',
                      )}
                    >
                      <div className="relative w-full h-40 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
                        {p.whiteBgImage ? (
                          <img
                            src={p.whiteBgImage}
                            alt={productTitle(p)}
                            className="w-full h-full object-contain p-3"
                          />
                        ) : (
                          <div className="text-gray-400 text-xs">暂无图片</div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-cyan-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
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
                            ¥{Number(p.referencePrice).toLocaleString()}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant={isSelected ? 'outline' : 'black'}
                          className="w-full text-xs mt-1 h-8"
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

        {/* Right panel */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={modifiers}
        >
          <ComboRightPanel
            selectedProducts={selectedProducts}
            schemeName={schemeName}
            livePrice={livePrice}
            currentSchemeId={currentSchemeId}
            livePriceNum={livePriceNum}
            totalReference={totalReference}
            totalDaily={totalDaily}
            hasDaily={hasDaily}
            hasReference={hasReference}
            showDiff={showDiff}
            diff={diff}
            schemes={schemes}
            schemeDialogOpen={schemeDialogOpen}
            saveDialogOpen={saveDialogOpen}
            onSchemeNameChange={setSchemeName}
            onLivePriceChange={setLivePrice}
            onClear={handleClear}
            onSaveAs={handleSaveAs}
            onOverwrite={handleOverwrite}
            onConfirmSave={handleConfirmSave}
            onLivePreview={handleLivePreview}
            onOpenSchemes={handleOpenSchemes}
            onLoadScheme={handleLoadScheme}
            onDeleteScheme={handleDeleteScheme}
            onSchemeDialogChange={setSchemeDialogOpen}
            onSaveDialogChange={setSaveDialogOpen}
          >
            <SortableProductList
              products={selectedProducts}
              onRemove={handleRemove}
            />
          </ComboRightPanel>
        </DndContext>
      </div>
    </div>
  );
};

export default ComboPage;
