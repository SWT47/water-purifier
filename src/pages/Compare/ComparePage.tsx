import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, X, Play, ChevronRight } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/Dialog';

interface ImageLightboxState {
  productId: string;
  images: string[];
  index: number;
}

interface VideoDialogState {
  productId: string;
  videoSrc: string;
}

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
  const [lightbox, setLightbox] = useState<ImageLightboxState | null>(null);
  const [videoDialog, setVideoDialog] = useState<VideoDialogState | null>(null);

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
    const mainFields = CATEGORY_FIELDS[categories[0]] || [];
    return mainFields.filter(
      (f: CategoryFieldConfig) =>
        f.type !== 'images' && f.type !== 'videos' && f.type !== 'image',
    );
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

    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return <span className="text-gray-400">-</span>;
    }

    if (field.type === 'boolean') {
      return value ? (
        <Badge variant="success">是</Badge>
      ) : (
        <Badge variant="secondary">否</Badge>
      );
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

  const handlePrevImage = () => {
    if (!lightbox) return;
    setLightbox({
      ...lightbox,
      index: lightbox.index <= 0 ? lightbox.images.length - 1 : lightbox.index - 1,
    });
  };

  const handleNextImage = () => {
    if (!lightbox) return;
    setLightbox({
      ...lightbox,
      index: lightbox.index >= lightbox.images.length - 1 ? 0 : lightbox.index + 1,
    });
  };

  const getRealImages = (p: Product): string[] => {
    const imgs = (p as any).realImages;
    return Array.isArray(imgs) ? imgs.filter(Boolean) : [];
  };

  const getRealVideos = (p: Product): string[] => {
    const vids = (p as any).realVideos;
    return Array.isArray(vids) ? vids.filter(Boolean) : [];
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
                  <th className="w-36 px-4 py-4 bg-gray-50 text-gray-900 text-left text-[13px] font-semibold sticky left-0 z-20 border-b border-gray-200">
                    产品
                  </th>
                  {products.map((p: Product) => (
                    <th
                      key={p.id}
                      className="w-[200px] px-4 py-4 bg-gray-50 text-center border-b border-gray-200"
                    >
                      <div className="relative">
                        <button
                          onClick={() => handleRemove(p.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors"
                          title="移除"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="w-16 h-16 mx-auto mb-2 bg-white border border-gray-200 rounded-md flex items-center justify-center">
                          {p.whiteBgImage ? (
                            <img
                              src={p.whiteBgImage}
                              alt={p.name || p.model || ''}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400">无图</span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {p.name || p.model || '产品'}
                        </div>
                        {p.referencePrice != null && (
                          <div className="text-xs text-blue-600 mt-0.5 font-semibold">
                            ¥{Number(p.referencePrice).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2.5 text-sm text-gray-500 bg-gray-50/50 sticky left-0">
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
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-2.5 text-sm text-gray-500 bg-gray-50/50 sticky left-0 whitespace-nowrap">
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

                {/* 实拍图行 */}
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-500 bg-gray-50/50 sticky left-0 whitespace-nowrap">
                    实拍图
                  </td>
                  {products.map((p: Product) => {
                    const imgs = getRealImages(p);
                    return (
                      <td key={p.id} className="px-4 py-3 text-center">
                        {imgs.length === 0 ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <div className="flex gap-1.5 justify-center flex-wrap">
                            {imgs.slice(0, 2).map((img: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() =>
                                  setLightbox({ productId: p.id, images: imgs, index: idx })
                                }
                                className="w-12 h-12 rounded border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-sm transition-all flex-shrink-0"
                                title={`实拍图 ${idx + 1}`}
                              >
                                <img
                                  src={img}
                                  alt={`实拍图 ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                            {imgs.length > 2 && (
                              <span className="text-xs text-gray-500 self-center">
                                +{imgs.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 实拍视频行 */}
                <tr className="border-b-0">
                  <td className="px-4 py-3 text-sm text-gray-500 bg-gray-50/50 sticky left-0 whitespace-nowrap">
                    实拍视频
                  </td>
                  {products.map((p: Product) => {
                    const vids = getRealVideos(p);
                    return (
                      <td key={p.id} className="px-4 py-3 text-center">
                        {vids.length === 0 ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <div className="flex gap-1.5 justify-center flex-wrap">
                            {vids.slice(0, 2).map((v: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() =>
                                  setVideoDialog({ productId: p.id, videoSrc: v })
                                }
                                className="w-16 h-12 rounded border border-gray-200 bg-gray-900 flex items-center justify-center gap-1 hover:border-blue-400 hover:shadow-sm transition-all flex-shrink-0 text-white/70 hover:text-white"
                                title={`视频 ${idx + 1}`}
                              >
                                <Play className="w-4 h-4" />
                                <span className="text-[10px]">视频{idx + 1}</span>
                              </button>
                            ))}
                            {vids.length > 2 && (
                              <span className="text-xs text-gray-500 self-center">
                                +{vids.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image lightbox */}
      <Dialog
        open={lightbox !== null}
        onOpenChange={(open: boolean) => !open && setLightbox(null)}
      >
        <DialogContent
          className="max-w-5xl bg-transparent border-none shadow-none p-0"
          showCloseButton={false}
        >
          {lightbox && (
            <div className="relative w-full">
              <DialogClose className="absolute right-0 -top-10 z-10 text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
                <span className="sr-only">关闭</span>
              </DialogClose>
              <div className="flex items-center justify-center">
                {lightbox.images.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                <img
                  src={lightbox.images[lightbox.index]}
                  alt="实拍图大图"
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
                {lightbox.images.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>
              {lightbox.images.length > 1 && (
                <div className="text-center text-white/60 text-xs mt-3">
                  {lightbox.index + 1} / {lightbox.images.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video dialog */}
      <Dialog
        open={videoDialog !== null}
        onOpenChange={(open: boolean) => !open && setVideoDialog(null)}
      >
        <DialogContent
          className="max-w-4xl bg-black border-none shadow-none p-0"
          showCloseButton={false}
        >
          {videoDialog && (
            <div className="relative w-full">
              <DialogClose className="absolute right-2 top-2 z-10 w-8 h-8 rounded-full bg-black/50 text-white/80 hover:text-white flex items-center justify-center">
                <X className="w-5 h-5" />
                <span className="sr-only">关闭</span>
              </DialogClose>
              <div className="aspect-video w-full">
                <video
                  key={videoDialog.videoSrc}
                  src={videoDialog.videoSrc}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComparePage;
