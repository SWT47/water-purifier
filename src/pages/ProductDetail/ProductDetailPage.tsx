import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getProduct } from '@/api/products';
import type {
  Product,
  CategoryFieldConfig,
  ProductCategory,
} from '@/utils/constants';
import { CATEGORY_FIELDS, CATEGORY_LABELS, PRICE_KEYS } from '@/utils/constants';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImage, setActiveImage] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getProduct(id)
      .then((p: Product) => {
        if (cancelled) return;
        setProduct(p);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('获取产品详情失败', err);
        toast.error('获取产品详情失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-400 text-sm">加载中...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <span className="text-gray-500">产品不存在</span>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
      </div>
    );
  }

  const category = product.category as ProductCategory;
  const fields = CATEGORY_FIELDS[category] || [];

  const allImages: string[] = [
    product.whiteBgImage,
    ...(product.realImages || []),
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
            返回列表
          </button>
          <div className="text-sm font-medium text-gray-900">
            产品详情
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/products/${category}`)}
          >
            <Edit className="w-4 h-4" />
            编辑产品
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
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
            <h1 className="text-xl font-bold text-gray-900">
              {product.name || product.model || '产品名称'}
            </h1>
            {product.brand && (
              <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
            )}
          </div>

          {/* Image + price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-gray-100">
            <div className="flex flex-col">
              <div className="aspect-square bg-gradient-to-b from-gray-50 to-gray-100 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden">
                {allImages.length > 0 ? (
                  <img
                    src={allImages[activeImage]}
                    alt="产品图"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400">暂无图片</span>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {allImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-16 h-16 rounded border-2 flex-shrink-0 overflow-hidden bg-gray-50 ${
                        activeImage === idx
                          ? 'border-blue-600'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`缩略图${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              {product.referencePrice != null && (
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">参考价格</div>
                  <div className="text-3xl font-bold text-blue-600">
                    ¥{product.referencePrice.toLocaleString()}
                  </div>
                </div>
              )}
              {product.dailyPrice != null && (
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">日常价格</div>
                  <div className="text-xl font-semibold text-gray-700">
                    ¥{product.dailyPrice.toLocaleString()}
                  </div>
                </div>
              )}
              {product.model && (
                <div className="mb-2">
                  <span className="text-sm text-gray-500">型号：</span>
                  <span className="text-sm text-gray-800">{product.model}</span>
                </div>
              )}
            </div>
          </div>

          {/* Parameters table */}
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              产品参数
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
              {fields.map((field: CategoryFieldConfig) => {
                const key = field.key as string;
                const value = product[key as keyof Product];
                const isPrice = PRICE_KEYS.has(key);

                let displayValue: React.ReactNode = '-';
                if (value !== null && value !== undefined && value !== '') {
                  if (field.type === 'boolean') {
                    displayValue = value ? (
                      <Badge variant="success">是</Badge>
                    ) : (
                      <Badge variant="secondary">否</Badge>
                    );
                  } else if (field.type === 'image') {
                    displayValue = '已上传';
                  } else if (field.type === 'images') {
                    displayValue = `${(value as string[]).length}张`;
                  } else if (field.type === 'videos') {
                    displayValue = `${(value as string[]).length}个`;
                  } else if (isPrice) {
                    displayValue = `¥${Number(value).toLocaleString()}`;
                  } else {
                    displayValue = String(value);
                  }
                }

                return (
                  <div
                    key={key}
                    className="flex py-2 border-b border-gray-100 text-sm"
                  >
                    <div className="w-28 text-gray-500 flex-shrink-0">
                      {field.label}
                    </div>
                    <div className={isPrice ? 'font-semibold text-blue-600' : 'text-gray-800'}>
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
