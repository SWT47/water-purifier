import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import {
  getProductList,
  createProduct,
  updateProduct,
  deleteProduct as deleteProductApi,
} from '@client/src/api/products';
import {
  type Product,
  type ProductCategory,
  type ProductListParams,
  type ProductCreateInput,
} from '@shared/api.interface';
import ProductFormModal from './ProductFormModal';
import ImportModal from './ImportModal';
import ProductImageCard from '@client/src/components/ProductImageCard';
import FilterBar, {
  type FilterValues,
  type ViewMode,
} from './FilterBar';
import ProductTable from './ProductTable';
import ProductDetailModal from './ProductDetailModal';

const ProductsPage: React.FC = () => {
  const { category = 'water_purifier' } = useParams<{
    category: string;
  }>();
  const navigate = useNavigate();
  const cat = category as ProductCategory;

  // 列表数据
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // 筛选
  const [filters, setFilters] = useState<FilterValues>({
    keyword: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
  });

  // 选中行
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // 弹窗状态
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formProduct, setFormProduct] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [formSubmitting, setFormSubmitting] = useState(false);

  // 品牌列表（从列表数据提取）
  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.brand) set.add(item.brand);
    }
    return Array.from(set).sort();
  }, [items]);

  // 加载列表
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: ProductListParams = {
        category: cat,
        page,
        pageSize,
      };
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.brand) params.brand = filters.brand;
      // 价格范围在前端过滤，后端不支持，先传基础参数
      const resp = await getProductList(params);
      if (resp.success) {
        let list = resp.data.items;
        // 前端价格过滤
        if (filters.minPrice) {
          const min = Number(filters.minPrice);
          list = list.filter(
            (p: Product) =>
              p.referencePrice !== null &&
              p.referencePrice !== undefined &&
              p.referencePrice >= min,
          );
        }
        if (filters.maxPrice) {
          const max = Number(filters.maxPrice);
          list = list.filter(
            (p: Product) =>
              p.referencePrice === null ||
              p.referencePrice === undefined ||
              p.referencePrice <= max,
          );
        }
        setItems(list);
        setTotal(resp.data.total);
      } else {
        toast.error(resp.message || '获取列表失败');
      }
    } catch (error) {
      logger.error('获取产品列表失败', error);
      toast.error('获取产品列表失败');
    } finally {
      setLoading(false);
    }
  }, [cat, page, pageSize, filters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 类目变化时重置分页
  useEffect(() => {
    setPage(1);
    setSelectedRowKeys([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleFilterChange = (values: FilterValues) => {
    setFilters(values);
    setPage(1);
  };

  const handlePageChange = (p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  };

  const handleView = (product: Product) => {
    setDetailProduct(product);
    setDetailOpen(true);
  };

  const handleAdd = () => {
    setFormProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setFormProduct(product);
    setFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteProduct(product);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (data: ProductCreateInput) => {
    setFormSubmitting(true);
    try {
      if (formProduct) {
        const resp = await updateProduct(formProduct.id, data);
        if (resp.success) {
          toast.success('更新成功');
          setFormOpen(false);
          fetchList();
        } else {
          toast.error(resp.message || '更新失败');
        }
      } else {
        const resp = await createProduct(data);
        if (resp.success) {
          toast.success('创建成功');
          setFormOpen(false);
          fetchList();
        } else {
          toast.error(resp.message || '创建失败');
        }
      }
    } catch (error) {
      logger.error('提交产品失败', error);
      toast.error('操作失败');
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteProduct) return;
    setDeleteOpen(false);
    try {
      const resp = await deleteProductApi(deleteProduct.id);
      if (resp.success) {
        toast.success('删除成功');
        setDeleteProduct(null);
        fetchList();
      } else {
        toast.error(resp.message || '删除失败');
      }
    } catch (error) {
      logger.error('删除产品失败', error);
      toast.error('删除失败');
    }
  };

  const handleCompare = () => {
    if (selectedRowKeys.length === 0) {
      toast.warning('请先选择产品');
      return;
    }
    navigate(`/compare?ids=${selectedRowKeys.join(',')}`);
  };

  const handleImport = () => {
    setImportOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <FilterBar
        category={cat}
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
          category={cat}
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="text-gray-400 text-sm">加载中...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="text-gray-400 text-sm">暂无产品</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item: Product) => (
                <ProductImageCard
                  key={item.id}
                  product={item}
                  category={cat}
                  onClick={() => handleView(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ProductDetailModal
        open={detailOpen}
        product={detailProduct}
        category={cat}
        onClose={() => setDetailOpen(false)}
      />

      <ProductFormModal
        open={formOpen}
        product={formProduct}
        category={cat}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除产品「
              {deleteProduct?.name || deleteProduct?.model || ''}
              」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        defaultCategory={cat}
        onSuccess={fetchList}
      />

      {formSubmitting && (
        <div className="fixed inset-0 z-[60] bg-black/20 flex items-center justify-center">
          <div className="bg-white px-6 py-3 rounded-[6px] shadow-lg text-sm text-gray-700">
            保存中...
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
