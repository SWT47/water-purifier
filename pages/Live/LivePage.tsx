import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Monitor,
  GitCompare,
  ChevronDown,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getProductList } from '@client/src/api/products';
import {
  CATEGORY_LABELS,
} from '@client/src/utils/categories';
import type {
  Product,
  ProductCategory,
  ProductListResult,
} from '@shared/api.interface';
import LiveProductCard from './LiveProductCard';
import LiveCompareView from './LiveCompareView';

const ALL_CATEGORIES: ProductCategory[] = [
  'water_purifier',
  'pipeline_machine',
  'pre_filter',
  'big_white_bottle',
  'central_purifier',
  'central_softener',
];

const LivePage: React.FC = () => {
  const { category: categoryParam } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const category = (categoryParam &&
    ALL_CATEGORIES.includes(categoryParam as ProductCategory)
    ? categoryParam
    : 'water_purifier') as ProductCategory;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // 加载产品列表
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProductList({ category, page: 1, pageSize: 20 })
      .then((resp) => {
        if (cancelled) return;
        const data = resp.data as ProductListResult;
        setProducts(data.items || []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        logger.error('直播模式加载产品失败', err);
        setError('加载失败，请稍后重试');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  // 切换类目后滚动到对应 tab
  useEffect(() => {
    if (activeTabRef.current && tabScrollRef.current) {
      const tabEl = activeTabRef.current;
      const container = tabScrollRef.current;
      const targetLeft =
        tabEl.offsetLeft - container.clientWidth / 2 + tabEl.clientWidth / 2;
      container.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  }, [category]);

  const handleCategoryChange = useCallback(
    (cat: ProductCategory) => {
      navigate(`/live/${cat}`);
    },
    [navigate],
  );

  const handleBackToAdmin = useCallback(() => {
    navigate(`/products/${category}`);
  }, [navigate, category]);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p: Product) => p.id === product.id);
      if (exists) {
        return prev.filter((p: Product) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  }, []);

  const handleRemoveProduct = useCallback((productId: string) => {
    setSelectedProducts((prev) =>
      prev.filter((p: Product) => p.id !== productId),
    );
  }, []);

  const handleOpenCompare = useCallback(() => {
    if (selectedProducts.length === 0 && products.length >= 2) {
      setSelectedProducts(products.slice(0, Math.min(4, products.length)));
    } else if (selectedProducts.length === 1 && products.length >= 2) {
      const others = products.filter(
        (p: Product) => p.id !== selectedProducts[0].id,
      );
      const needed = Math.min(3, others.length);
      if (others.length > 0) {
        setSelectedProducts((prev) => [
          ...prev,
          ...others.slice(0, needed),
        ]);
      }
    }
    setShowCompare(true);
  }, [selectedProducts, products]);

  const handleCloseCompare = useCallback(() => {
    setShowCompare(false);
  }, []);

  // 对比视图
  if (showCompare) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <div
          className="relative bg-white overflow-hidden"
          style={{
            aspectRatio: '9 / 16',
            height: '100vh',
            maxWidth: '100vw',
          }}
        >
          <LiveCompareView
            category={category}
            products={selectedProducts}
            onClose={handleCloseCompare}
            onRemoveProduct={handleRemoveProduct}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-900">
      <div
        className="relative bg-white flex flex-col overflow-hidden"
        style={{
          aspectRatio: '9 / 16',
          height: '100vh',
          maxWidth: '100vw',
        }}
      >
        {/* 顶部栏：返回后台按钮 */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-100">
          <button
            onClick={handleBackToAdmin}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-black"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium">返回后台</span>
          </button>
          <span className="text-base font-bold text-gray-900">
            {CATEGORY_LABELS[category]}
          </span>
          <button
            onClick={handleBackToAdmin}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-black"
            title="返回后台模式"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        {/* 顶部 Tab 栏 */}
        <div
          ref={tabScrollRef}
          className="flex-shrink-0 overflow-x-auto border-b border-gray-100 bg-white"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`
            .live-tabs::-webkit-scrollbar { display: none; }
          `}</style>
          <div className="flex items-center gap-1 px-3 py-2 live-tabs">
            {ALL_CATEGORIES.map((cat) => {
              const isActive = cat === category;
              return (
                <button
                  key={cat}
                  ref={isActive ? activeTabRef : null}
                  onClick={() => handleCategoryChange(cat)}
                  className={[
                    'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  ].join(' ')}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 内容区：产品卡片上下堆叠 */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <span className="text-base text-gray-400">加载中...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-16">
              <span className="text-base text-red-500">{error}</span>
            </div>
          )}
          {!loading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <ChevronDown className="w-8 h-8 text-gray-300" />
              <span className="text-base text-gray-400">暂无产品</span>
            </div>
          )}
          {!loading &&
            !error &&
            products.map((product: Product) => (
              <LiveProductCard
                key={product.id}
                product={product}
                category={category}
                isSelected={selectedProducts.some(
                  (p: Product) => p.id === product.id,
                )}
                onSelect={handleProductSelect}
              />
            ))}
        </div>

        {/* 底部对比栏 */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3">
          <button
            onClick={handleOpenCompare}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-base transition-colors"
            style={{ backgroundColor: '#2563EB', color: 'white' }}
          >
            <GitCompare className="w-5 h-5" />
            {selectedProducts.length > 0
              ? `对比 (${selectedProducts.length}/2)`
              : '产品对比'}
          </button>
          {selectedProducts.length > 0 && (
            <p className="text-xs text-gray-400 text-center mt-2">
              已选 {selectedProducts.length} 个产品，点击卡片可切换
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePage;
