import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, X } from 'lucide-react';
import { compareProducts } from '@/api/products';
import type {
  Product,
  CategoryFieldConfig,
  ProductCategory,
} from '@/utils/constants';
import {
  CATEGORY_FIELDS,
  CATEGORY_LABELS,
  PRICE_KEYS,
  ALL_CATEGORIES,
} from '@/utils/constants';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const idsParam = searchParams.get('ids') || '';
  const initialIds = idsParam
    ? idsParam.split(',').filter((s: string) => Boolean(s.trim()))
    : [];

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(initialIds.length > 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialIds.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    compareProducts(initialIds)
      .then((result: Product[]) => {
        if (cancelled) return;
        setProducts(result || []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('加载对比产品失败', err);
        setError('加载失败，请稍后重试');
        toast.error('加载对比产品失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set<ProductCategory>();
    for (const p of products) {
      if (p.category && ALL_CATEGORIES.includes(p.category as ProductCategory)) {
        set.add(p.category as ProductCategory);
      }
    }
    return Array.from(set);
  }, [products]);

  const displayFields = useMemo(() => {
    if (categories.length === 0) return [];
    // Use the first category's fields (most comprehensive case)
    const mainFields = CATEGORY_FIELDS[categories[0]] || [];
    // If only one category, use all its fields; otherwise common subset
    return mainFields;
  }, [categories]);

  const handleRemove = (id: string) => {
    const next = products.filter((p: Product) => p.id !== id);
    setProducts(next);
    const ids = next.map((p: Product) => p.id).join(',');
    if (ids) {
      searchParams.set('ids', ids);
    } else {
      searchParams.delete('ids');
    }
    setSearchParams(searchParams, { replace: true });
  };

  const renderCell = (
    field: CategoryFieldConfig,
    product: Product,
  ): React.ReactNode => {
    const value = product[field.key as keyof Product];
    const isPrice = PRICE_KEYS.has(String(field.key));

    if (value === null || value === undefined || value === '' ||
      (Array.isArray(value) && value.length === 0)) {
      return <span className="text-gray-400">-</span>;
    }

    if (field.type === 'boolean') {
      return value ? (
        <Badge variant="black">是</Badge>
      ) : (
        <Badge variant="secondary">否</Badge>
      );
    }

    if (field.type === 'image') {
      return '已上传';
    }

    if (field.type === 'images') {
      return `${(value as string[]).length}张`;
    }

    if (field.type === 'videos') {
      return `${(value as string[]).length}个`;
    }

    if (isPrice) {
      return (
        <span className="font-bold text-blue-600">
          ¥{Number(value).toLocaleString()}
        </span>
      );
    }

    return String(value);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="h-12 bg-black text-white flex items-center justify-between px-6 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>
        <h1 className="text-sm font-semibold">产品对比</h1>
        <span className="text-xs text-white/60">共 {products.length} 款</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">加载中...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 text-sm">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-base">暂无对比产品</p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => navigate('/products/water_purifier')}
            >
              去选择产品
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="w-36 px-4 py-3 bg-black text-white text-left text-[13px] font-medium sticky left-0 z-20">
                    对比项
                  </th>
                  {products.map((p: Product) => (
                    <th
                      key={p.id}
                      className="w-[200px] px-4 py-3 bg-black text-white text-center text-[13px] font-medium"
                    >
                      <div className="relative">
                        <button
                          onClick={() => handleRemove(p.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
                          title="移除"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="w-16 h-16 mx-auto mb-2 bg-white/10 rounded flex items-center justify-center">
                          {p.whiteBgImage ? (
                            <img
                              src={p.whiteBgImage}
                              alt={p.name || p.model || ''}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-white/50">无图</span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-white truncate">
                          {p.name || p.model || '产品'}
                        </div>
                        {p.referencePrice != null && (
                          <div className="text-xs text-blue-300 mt-0.5">
                            ¥{Number(p.referencePrice).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Category row */}
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2.5 text-sm text-gray-500 bg-gray-50 sticky left-0">
                    类目
                  </td>
                  {products.map((p: Product) => (
                    <td
                      key={p.id}
                      className="px-4 py-2.5 text-sm text-center text-gray-800"
                    >
                      {CATEGORY_LABELS[p.category as ProductCategory] || p.category}
                    </td>
                  ))}
                </tr>
                {displayFields.map((field: CategoryFieldConfig) => (
                  <tr
                    key={String(field.key)}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <td className="px-4 py-2.5 text-sm text-gray-500 bg-gray-50 sticky left-0 whitespace-nowrap">
                      {field.label}
                    </td>
                    {products.map((p: Product) => (
                      <td
                        key={p.id}
                        className="px-4 py-2.5 text-sm text-center"
                      >
                        {renderCell(field, p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
