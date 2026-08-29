import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CategorySidebar from './CategorySidebar';
import FilterBar, { type FilterValues, type ViewMode } from './FilterBar';
import ProductTable from './ProductTable';
import ProductFormModal from './ProductFormModal';
import ImportModal from './ImportModal';
import {
  getProductList,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/api/products';
import type {
  Product,
  ProductCategory,
  ProductCreateInput,
  ProductListResult,
} from '@/utils/constants';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '@/utils/constants';
import { Smartphone } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const { category: categoryParam } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const category = useMemo(() => {
    if (
      categoryParam &&
      ALL_CATEGORIES.includes(categoryParam as ProductCategory)
    ) {
      return categoryParam as ProductCategory;
    }
    return 'water_purifier';
  }, [categoryParam]);

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const [filters, setFilters] = useState<FilterValues>({
    keyword: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    isOnSale: '',
  });

  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);

  // Load products
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, unknown> = {
      category,
      page,
      pageSize,
    };
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.brand) params.brand = filters.brand;
    if (filters.isOnSale !== '') params.isOnSale = filters.isOnSale === 'true';
    if (filters.minPrice) params.minPrice = Number(filters.minPrice);
    if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);

    getProductList(params as Parameters<typeof getProductList>[0])
      .then((result: ProductListResult) => {
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('加载产品列表失败', err);
        toast.error('加载产品列表失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, page, pageSize, filters]);

  // Reset selected when category changes
  useEffect(() => {
    setSelectedRowKeys([]);
  }, [category, filters]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of items) {
      if (p.brand) set.add(p.brand);
    }
    return Array.from(set).sort();
  }, [items]);

  const handleCategoryChange = useCallback(
    (cat: ProductCategory) => {
      navigate(`/products/${cat}`);
      setPage(1);
    },
    [navigate],
  );

  const handlePageChange = useCallback((newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  }, []);

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilters(values);
    setPage(1);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingProduct(null);
    setFormModalOpen(true);
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setFormModalOpen(true);
  }, []);

  const handleView = useCallback(
    (product: Product) => {
      navigate(`/products/detail/${product.id}`);
    },
    [navigate],
  );

  const handleDelete = useCallback((product: Product) => {
    if (!confirm(`确定要删除「${product.name || product.model || '产品'}」吗？`)) {
      return;
    }
    deleteProduct(product.id)
      .then(() => {
        toast.success('删除成功');
        setSelectedRowKeys((prev) => prev.filter((id: string) => id !== product.id));
        setItems((prev) => prev.filter((p: Product) => p.id !== product.id));
        setTotal((prev) => Math.max(0, prev - 1));
      })
      .catch((err: unknown) => {
        console.error('删除失败', err);
        toast.error('删除失败');
      });
  }, []);

  const handleSubmitForm = useCallback(
    async (data: ProductCreateInput) => {
      try {
        if (editingProduct) {
          await updateProduct(editingProduct.id, data);
          toast.success('保存成功');
        } else {
          await createProduct(data);
          toast.success('创建成功');
        }
        setFormModalOpen(false);
        setEditingProduct(null);
        // Reload
        setPage(1);
      } catch (err: unknown) {
        console.error('保存失败', err);
        toast.error('保存失败');
      }
    },
    [editingProduct],
  );

  const handleCompare = useCallback(() => {
    if (selectedRowKeys.length === 0) return;
    const ids = selectedRowKeys.join(',');
    navigate(`/compare?ids=${encodeURIComponent(ids)}`);
  }, [selectedRowKeys, navigate]);

  const handleImport = useCallback(() => {
    setImportModalOpen(true);
  }, []);

  const handleImportSuccess = useCallback(() => {
    setPage(1);
  }, []);

  const categoryLabel = CATEGORY_LABELS[category] || '产品';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="h-12 bg-black text-white flex items-center px-6 flex-shrink-0">
        <h1 className="text-sm font-semibold">净水器直播展示系统</h1>
        <span className="ml-2 text-xs text-white/60">
          · {categoryLabel}管理
        </span>
        <button
          onClick={() => navigate(`/live/${category}`)}
          className="ml-auto bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5" />
          直播模式
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <CategorySidebar
          activeCategory={category}
          onCategoryChange={handleCategoryChange}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <FilterBar
            category={category}
            brands={brands}
            selectedCount={selectedRowKeys.length}
            viewMode={viewMode}
            onFilterChange={handleFilterChange}
            onAdd={handleAdd}
            onImport={handleImport}
            onCompare={handleCompare}
            onViewModeChange={setViewMode}
          />

          {viewMode === 'table' ? (
            <ProductTable
              category={category}
              items={items}
              total={total}
              page={page}
              pageSize={pageSize}
              loading={loading}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={setSelectedRowKeys}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <ProductCardView
              items={items}
              total={total}
              page={page}
              pageSize={pageSize}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
            />
          )}
        </div>
      </div>

      <ProductFormModal
        open={formModalOpen}
        product={editingProduct}
        category={category}
        onClose={() => {
          setFormModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSubmitForm}
      />

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        defaultCategory={category}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

/* ---------- Card View (complementary) ---------- */

interface CardViewProps {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
}

const ProductCardView: React.FC<CardViewProps> = ({
  items,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onView,
  onEdit,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">暂无产品</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((product: Product) => (
              <div
                key={product.id}
                className="bg-white rounded-md overflow-hidden shadow-card-sm border border-gray-100 hover:-translate-y-0.5 hover:shadow-card-md transition-all cursor-pointer"
                onClick={() => onView(product)}
              >
                <div className="w-full aspect-square bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
                  {product.whiteBgImage ? (
                    <img
                      src={product.whiteBgImage}
                      alt={product.name || product.model || '产品图片'}
                      className="w-full h-full object-contain p-3"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">暂无图片</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-[11px] text-gray-500">
                    {product.brand || '未知品牌'}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 truncate mt-0.5">
                    {product.name || product.model || '产品名称'}
                  </h3>
                  {product.referencePrice != null ? (
                    <div className="text-lg font-bold text-blue-600 mt-1">
                      ¥{Number(product.referencePrice).toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 mt-1">价格待定</div>
                  )}
                  <button
                    className="w-full mt-2 text-xs text-gray-500 hover:text-blue-600 py-1 border border-gray-200 rounded"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onEdit(product);
                    }}
                  >
                    编辑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-2 py-3 text-sm text-gray-600 flex-shrink-0">
        <div>共 {total} 条</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1, pageSize)}
            disabled={page <= 1}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="text-gray-500">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => onPageChange(page + 1, pageSize)}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
