import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Search,
  Check,
  Minus,
  Play,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  VideoIcon,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { Checkbox } from '@client/src/components/ui/checkbox';
import { ScrollArea } from '@client/src/components/ui/scroll-area';
import { Image } from '@client/src/components/ui/image';
import { compareProducts, getProductList } from '@client/src/api/products';
import {
  CATEGORY_FIELDS,
  CATEGORY_LABELS,
} from '@client/src/utils/categories';
import type {
  Product,
  ProductCategory,
  CategoryFieldConfig,
} from '@shared/api.interface';
import ProductDetailModal from '../Products/ProductDetailModal';

const MAX_COMPARE = 4;
const PRICE_COLOR = '#2563EB';

const ADVANTAGE_LOWER_KEYS = new Set([
  'dailyPrice',
  'referencePrice',
  'filterTotalCost',
]);

const ADVANTAGE_HIGHER_KEYS = new Set(['flux', 'launchYear', 'waterFlowRate']);

const ADVANTAGE_WATERMODE_KEY = 'waterMode';

const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>('');
  const [candidateProducts, setCandidateProducts] = useState<Product[]>([]);
  const [candidateLoading, setCandidateLoading] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxProductIdx, setLightboxProductIdx] = useState(0);
  const [lightboxImgIdx, setLightboxImgIdx] = useState(0);

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoProductIdx, setVideoProductIdx] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const idsParam = searchParams.get('ids') || '';

  useEffect(() => {
    const ids = idsParam
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    compareProducts(ids)
      .then((resp) => {
        if (cancelled) return;
        const map = new Map<string, Product>();
        resp.data.forEach((p: Product) => map.set(p.id, p));
        const ordered: Product[] = ids
          .map((id: string) => map.get(id))
          .filter((p): p is Product => Boolean(p));
        setProducts(ordered);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        logger.error('加载对比产品失败', error);
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idsParam]);

  const category: ProductCategory | null = useMemo(() => {
    if (products.length === 0) return null;
    return products[0].category;
  }, [products]);

  const fieldConfigs: CategoryFieldConfig[] = useMemo(() => {
    if (!category) return [];
    return CATEGORY_FIELDS[category];
  }, [category]);

  const displayFields: CategoryFieldConfig[] = useMemo(() => {
    return fieldConfigs.filter(
      (f: CategoryFieldConfig) =>
        f.type !== 'image' && f.type !== 'images' && f.type !== 'videos',
    );
  }, [fieldConfigs]);

  const syncIdsToUrl = useCallback(
    (ids: string[]) => {
      const params = new URLSearchParams(searchParams);
      if (ids.length === 0) {
        params.delete('ids');
      } else {
        params.set('ids', ids.join(','));
      }
      setSearchParams(params, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const handleRemove = useCallback(
    (id: string) => {
      const next = products.filter((p: Product) => p.id !== id);
      setProducts(next);
      syncIdsToUrl(next.map((p: Product) => p.id));
    },
    [products, syncIdsToUrl],
  );

  const handleClear = useCallback(() => {
    setProducts([]);
    syncIdsToUrl([]);
  }, [syncIdsToUrl]);

  const handleOpenAddDialog = useCallback(() => {
    if (!category) return;
    if (products.length >= MAX_COMPARE) return;
    setAddDialogOpen(true);
    setKeyword('');
    setSelectedIds([]);
    loadCandidates(category, '');
  }, [category, products.length]);

  const loadCandidates = useCallback(
    (cat: ProductCategory, kw: string) => {
      setCandidateLoading(true);
      getProductList({ category: cat, keyword: kw, pageSize: 100 })
        .then((resp) => {
          setCandidateProducts(resp.data.items);
        })
        .catch((error: unknown) => {
          logger.error('加载候选产品失败', error);
          setCandidateProducts([]);
        })
        .finally(() => {
          setCandidateLoading(false);
        });
    },
    [],
  );

  useEffect(() => {
    if (!addDialogOpen || !category) return;
    const timer = window.setTimeout(() => {
      loadCandidates(category, keyword);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword, addDialogOpen, category, loadCandidates]);

  const availableCandidates: Product[] = useMemo(() => {
    const currentIds = new Set(products.map((p: Product) => p.id));
    return candidateProducts.filter(
      (p: Product) => !currentIds.has(p.id),
    );
  }, [candidateProducts, products]);

  const handleToggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev: string[]) => {
        const exists = prev.includes(id);
        if (exists) {
          return prev.filter((x: string) => x !== id);
        }
        if (prev.length + products.length >= MAX_COMPARE) {
          return prev;
        }
        return [...prev, id];
      });
    },
    [products.length],
  );

  const handleConfirmAdd = useCallback(() => {
    if (selectedIds.length === 0) {
      setAddDialogOpen(false);
      return;
    }
    const remainingSlots = MAX_COMPARE - products.length;
    const toAdd = selectedIds.slice(0, remainingSlots);
    const newIds = [...products.map((p: Product) => p.id), ...toAdd];
    syncIdsToUrl(newIds);
    setAddDialogOpen(false);
    setSelectedIds([]);
  }, [selectedIds, products, syncIdsToUrl]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isRowDifferent = useCallback(
    (field: CategoryFieldConfig): boolean => {
      if (products.length <= 1) return false;
      const firstValue = getCompareValue(products[0], field);
      return products.some(
        (p: Product) => getCompareValue(p, field) !== firstValue,
      );
    },
    [products],
  );

  const advantageIndexes = useCallback(
    (field: CategoryFieldConfig): Set<number> => {
      if (products.length < 2) return new Set();
      const key = field.key as string;
      const values = products.map((p: Product) => p[field.key]);

      if (ADVANTAGE_LOWER_KEYS.has(key)) {
        const nums = values.map((v) =>
          v === null || v === undefined || v === '' ? null : Number(v),
        );
        const validNums = nums.filter(
          (n): n is number => n !== null && !Number.isNaN(n),
        );
        if (validNums.length === 0) return new Set();
        const min = Math.min(...validNums);
        const idxs = new Set<number>();
        nums.forEach((n, i) => {
          if (n === min) idxs.add(i);
        });
        return idxs;
      }

      if (ADVANTAGE_HIGHER_KEYS.has(key)) {
        const nums = values.map((v) => {
          if (v === null || v === undefined || v === '') return null;
          const s = String(v).replace(/[^0-9.]/g, '');
          const n = parseFloat(s);
          return Number.isNaN(n) ? null : n;
        });
        const validNums = nums.filter(
          (n): n is number => n !== null && !Number.isNaN(n),
        );
        if (validNums.length === 0) return new Set();
        const max = Math.max(...validNums);
        const idxs = new Set<number>();
        nums.forEach((n, i) => {
          if (n === max) idxs.add(i);
        });
        return idxs;
      }

      if (key === ADVANTAGE_WATERMODE_KEY) {
        const idxs = new Set<number>();
        values.forEach((v, i) => {
          const s = String(v || '');
          if (s.includes('/') || s.includes('双') || s.includes('两')) {
            idxs.add(i);
          }
        });
        return idxs;
      }

      return new Set();
    },
    [products],
  );

  const openLightbox = (productIdx: number, imgIdx: number) => {
    setLightboxProductIdx(productIdx);
    setLightboxImgIdx(imgIdx);
    setLightboxOpen(true);
  };

  const prevLightboxImg = useCallback(() => {
    const imgs = products[lightboxProductIdx]?.realImages ?? [];
    if (imgs.length === 0) return;
    setLightboxImgIdx((prev) =>
      prev === 0 ? imgs.length - 1 : prev - 1,
    );
  }, [lightboxProductIdx, products]);

  const nextLightboxImg = useCallback(() => {
    const imgs = products[lightboxProductIdx]?.realImages ?? [];
    if (imgs.length === 0) return;
    setLightboxImgIdx((prev) =>
      prev === imgs.length - 1 ? 0 : prev + 1,
    );
  }, [lightboxProductIdx, products]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevLightboxImg();
      if (e.key === 'ArrowRight') nextLightboxImg();
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, prevLightboxImg, nextLightboxImg]);

  const openVideo = (productIdx: number, videoIdx: number) => {
    setVideoProductIdx(productIdx);
    setActiveVideoIndex(videoIdx);
    setVideoModalOpen(true);
  };

  const prevVideo = useCallback(() => {
    const videos = products[videoProductIdx]?.realVideos ?? [];
    if (videos.length === 0) return;
    setActiveVideoIndex((prev) =>
      prev === 0 ? videos.length - 1 : prev - 1,
    );
  }, [videoProductIdx, products]);

  const nextVideo = useCallback(() => {
    const videos = products[videoProductIdx]?.realVideos ?? [];
    if (videos.length === 0) return;
    setActiveVideoIndex((prev) =>
      prev === videos.length - 1 ? 0 : prev + 1,
    );
  }, [videoProductIdx, products]);

  useEffect(() => {
    if (!videoModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevVideo();
      if (e.key === 'ArrowRight') nextVideo();
      if (e.key === 'Escape') setVideoModalOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [videoModalOpen, prevVideo, nextVideo]);

  if (!loading && products.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="返回"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-base font-semibold text-gray-900">产品对比</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-sm text-gray-500">
            暂未选择对比产品，请从产品列表中添加
          </div>
          <Button
            variant="default"
            onClick={() => navigate('/products/water_purifier')}
          >
            去选择产品
          </Button>
        </div>
      </div>
    );
  }

  const lightboxImages = products[lightboxProductIdx]?.realImages ?? [];
  const videoList = products[videoProductIdx]?.realVideos ?? [];
  const videoProductName = products[videoProductIdx]?.name || '';

  return (
    <>
      <div className="h-full flex flex-col bg-gray-50">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="返回"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-base font-semibold text-gray-900">产品对比</h1>
            {category && (
              <span className="text-xs text-gray-500 ml-2">
                {CATEGORY_LABELS[category]} · {products.length} 个产品
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenAddDialog}
              disabled={products.length >= MAX_COMPARE}
            >
              <Plus className="w-4 h-4" />
              添加产品
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={products.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              清空对比
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              加载中...
            </div>
          ) : (
            <div
              className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden"
              style={{ minWidth: 600 }}
            >
              <table className="w-full border-separate" style={{ borderSpacing: 0, tableLayout: 'auto' }}>
                <colgroup>
                  <col style={{ width: 140 }} />
                  {products.map((p: Product) => (
                    <col key={p.id} style={{ minWidth: 180 }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th
                      className="bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left align-top"
                      style={{ width: 140 }}
                    >
                      <span className="text-xs font-medium text-gray-500">
                        参数 / 产品
                      </span>
                    </th>
                    {products.map((p: Product) => (
                      <th
                        key={p.id}
                        className="bg-white border-b border-r border-gray-200 px-4 py-3 align-top last:border-r-0"
                      >
                         <ProductHeaderCell
                           product={p}
                           onRemove={() => handleRemove(p.id)}
                           onViewDetail={() => {
                             setDetailProduct(p);
                             setDetailOpen(true);
                           }}
                         />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayFields.map((field: CategoryFieldConfig, idx: number) => {
                    const hasMediaRows =
                      products.some(
                        (p: Product) => (p.realImages?.length ?? 0) > 0,
                      ) ||
                      products.some(
                        (p: Product) => (p.realVideos?.length ?? 0) > 0,
                      );
                    const isLastParamRow = idx === displayFields.length - 1;
                    const advIdx = advantageIndexes(field);
                    return (
                      <tr key={String(field.key)}>
                        <td
                          className={[
                             'sticky left-0 z-10 border-b border-r border-gray-200 px-4 py-3 text-[15px] text-gray-900 font-bold bg-gray-100/80 tracking-wide',
                            isLastParamRow && !hasMediaRows ? 'border-b-0' : '',
                          ].join(' ')}
                        >
                          {field.label}
                        </td>
                        {products.map((p: Product, pIdx: number) => (
                          <td
                            key={p.id}
                            className={[
                               'border-b border-r border-gray-200 px-4 py-3 text-sm align-middle bg-white last:border-r-0',
                              isLastParamRow && !hasMediaRows ? 'border-b-0' : '',
                            ].join(' ')}
                          >
                            <ValueCell
                              product={p}
                              field={field}
                              isAdvantage={advIdx.has(pIdx)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                  {/* 产品实拍图行 */}
                  {products.some(
                    (p: Product) => (p.realImages?.length ?? 0) > 0,
                  ) && (
                    <tr>
                      <td
                        className={[
                           'sticky left-0 z-10 border-b border-r border-gray-200 px-4 py-3 text-[15px] text-gray-900 font-bold bg-gray-100/80 tracking-wide align-top',
                          !products.some(
                            (p: Product) => (p.realVideos?.length ?? 0) > 0,
                          )
                            ? 'border-b-0'
                            : '',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          产品实拍图
                        </div>
                      </td>
                      {products.map((p: Product, pIdx: number) => (
                        <td
                          key={p.id}
                          className={[
                            'border-b border-r border-gray-200 px-4 py-3 align-middle bg-white last:border-r-0',
                            !products.some(
                              (pp: Product) => (pp.realVideos?.length ?? 0) > 0,
                            )
                              ? 'border-b-0'
                              : '',
                          ].join(' ')}
                        >
                          <RealImagesCell
                            images={p.realImages ?? []}
                            onClick={(imgIdx) => openLightbox(pIdx, imgIdx)}
                          />
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* 产品实拍视频行 */}
                  {products.some(
                    (p: Product) => (p.realVideos?.length ?? 0) > 0,
                  ) && (
                    <tr>
                      <td className="sticky left-0 z-10 border-r border-gray-200 px-4 py-3 text-[15px] text-gray-900 font-bold bg-gray-100/80 tracking-wide align-top">
                        <div className="flex items-center gap-1.5">
                          <VideoIcon className="w-3.5 h-3.5" />
                          产品实拍视频
                        </div>
                      </td>
                      {products.map((p: Product, pIdx: number) => (
                        <td
                          key={p.id}
                          className="px-4 py-3 align-middle bg-white border-r border-gray-200 last:border-r-0"
                        >
                          <RealVideosCell
                            videos={p.realVideos ?? []}
                            onClick={(vIdx) => openVideo(pIdx, vIdx)}
                          />
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 添加产品对话框 */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>添加对比产品</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索品牌 / 型号 / 名称"
                  value={keyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setKeyword(e.target.value)
                  }
                  className="pl-9"
                />
              </div>
              <div className="text-xs text-gray-500">
                最多可对比 {MAX_COMPARE} 个产品，已选 {products.length} 个，
                还可添加 {Math.max(0, MAX_COMPARE - products.length)} 个
              </div>
              <ScrollArea className="h-[360px] border border-gray-200 rounded-md">
                {candidateLoading ? (
                  <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                    加载中...
                  </div>
                ) : availableCandidates.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                    暂无同类目产品
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {availableCandidates.map((p: Product) => {
                      const isChecked = selectedIds.includes(p.id);
                      const isDisabled =
                        !isChecked &&
                        selectedIds.length + products.length >= MAX_COMPARE;
                      return (
                        <div
                          key={p.id}
                          className={[
                            'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                            isDisabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-gray-50',
                          ].join(' ')}
                          onClick={() => {
                            if (!isDisabled) handleToggleSelect(p.id);
                          }}
                        >
                          <Checkbox
                            checked={isChecked}
                            disabled={isDisabled}
                            onCheckedChange={() => {
                              if (!isDisabled) handleToggleSelect(p.id);
                            }}
                          />
                          <div className="w-10 h-10 bg-gray-50 rounded border border-gray-200 flex-shrink-0 overflow-hidden">
                            {p.whiteBgImage ? (
                              <Image
                                src={p.whiteBgImage}
                                alt={p.model || p.name || ''}
                                width={40}
                                height={40}
                                className="w-full h-full object-contain"
                              />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {p.brand || '-'} {p.name || ''} {p.model || ''}
                            </div>
                            {p.referencePrice !== null &&
                            p.referencePrice !== undefined ? (
                              <div
                                className="text-xs font-semibold"
                                style={{ color: PRICE_COLOR }}
                              >
                                ¥{p.referencePrice.toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">价格待定</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button
                variant="default"
                onClick={handleConfirmAdd}
                disabled={selectedIds.length === 0}
              >
                确认添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 图片灯箱 */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="bg-black/90 border-0 p-0 max-w-none w-screen h-screen m-0 rounded-none flex items-center justify-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>

          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={prevLightboxImg}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
                aria-label="上一张"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextLightboxImg}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
                aria-label="下一张"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center">
            <Image
              src={lightboxImages[lightboxImgIdx]}
              alt={`实拍图 ${lightboxImgIdx + 1}`}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>

          {lightboxImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 max-w-[80vw] overflow-x-auto py-2 px-2 bg-black/40 rounded-[6px]">
              {lightboxImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setLightboxImgIdx(idx)}
                  className={`w-14 h-14 flex-shrink-0 border-2 rounded overflow-hidden transition-colors ${
                    idx === lightboxImgIdx
                      ? 'border-blue-500'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`缩略图 ${idx + 1}`}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="absolute top-4 left-4 text-white text-sm bg-black/40 px-3 py-1 rounded">
            {lightboxImgIdx + 1} / {lightboxImages.length}
          </div>
        </DialogContent>
      </Dialog>

      {/* 视频弹窗 */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="bg-black/90 border-0 p-0 max-w-none w-screen h-screen m-0 rounded-none flex flex-col items-center justify-center">
          <button
            onClick={() => setVideoModalOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>

          {videoList.length > 1 && (
            <>
              <button
                onClick={prevVideo}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
                aria-label="上一个视频"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextVideo}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
                aria-label="下一个视频"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative max-w-[85vw] w-full">
            <div className="text-white text-sm mb-3">{videoProductName}</div>
            <video
              key={`${videoProductIdx}-${activeVideoIndex}`}
              src={videoList[activeVideoIndex]}
              controls
              autoPlay
              className="w-full aspect-video bg-black rounded-[6px]"
            />
          </div>

          {videoList.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 max-w-[80vw] overflow-x-auto py-2 px-2 bg-black/40 rounded-[6px]">
              {videoList.map((_: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveVideoIndex(idx)}
                  className={`w-14 h-14 flex-shrink-0 border-2 rounded overflow-hidden transition-colors bg-gray-800 flex items-center justify-center relative ${
                    idx === activeVideoIndex
                      ? 'border-blue-500'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  <span className="absolute bottom-0.5 text-[9px] text-white/70">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="absolute top-4 left-4 text-white text-sm bg-black/40 px-3 py-1 rounded">
            {activeVideoIndex + 1} / {videoList.length}
          </div>
        </DialogContent>
      </Dialog>

      <ProductDetailModal
        open={detailOpen}
        product={detailProduct}
        category={category || 'water_purifier'}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
};

// ---- 子组件 ----

interface ProductHeaderCellProps {
  product: Product;
  onRemove: () => void;
  onViewDetail: () => void;
}

const ProductHeaderCell: React.FC<ProductHeaderCellProps> = ({
  product,
  onRemove,
  onViewDetail,
}) => {
  return (
    <div className="flex flex-col items-center gap-2 relative w-full">
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
        aria-label="移除"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="w-24 h-24 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden">
        {product.whiteBgImage ? (
          <Image
            src={product.whiteBgImage}
            alt={product.model || product.name || ''}
            width={96}
            height={96}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-xs text-gray-400">无图</span>
        )}
      </div>
      <div className="text-center w-full">
        <button
          onClick={onViewDetail}
          className="text-sm font-semibold text-gray-900 leading-tight hover:text-blue-600 transition-colors"
          title="查看详情"
        >
          {product.brand || '-'}
        </button>
        <button
          onClick={onViewDetail}
          className="text-xs text-gray-500 mt-0.5 truncate hover:text-blue-600 transition-colors"
          title="查看详情"
        >
          {product.name || product.model || '-'}
        </button>
      </div>
      {product.referencePrice !== null &&
      product.referencePrice !== undefined ? (
        <div
          className="text-lg font-bold leading-tight"
          style={{ color: PRICE_COLOR }}
        >
          ¥{product.referencePrice.toLocaleString()}
        </div>
      ) : product.dailyPrice !== null && product.dailyPrice !== undefined ? (
        <div
          className="text-lg font-bold leading-tight"
          style={{ color: PRICE_COLOR }}
        >
          ¥{product.dailyPrice.toLocaleString()}
        </div>
      ) : (
        <div className="text-sm text-gray-400">价格待定</div>
      )}
    </div>
  );
};

interface RealImagesCellProps {
  images: string[];
  onClick: (index: number) => void;
}

const RealImagesCell: React.FC<RealImagesCellProps> = ({ images, onClick }) => {
  if (images.length === 0) {
    return <span className="text-gray-400 text-xs">-</span>;
  }
  const displayImages = images.slice(0, 4);
  const remaining = images.length - displayImages.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {displayImages.map((img: string, idx: number) => (
        <button
          key={idx}
          onClick={() => onClick(idx)}
          className="w-12 h-12 bg-white border border-gray-200 rounded overflow-hidden hover:border-blue-500 hover:shadow-sm transition-all group"
        >
          <Image
            src={img}
            alt={`实拍图 ${idx + 1}`}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
      {remaining > 0 && (
        <button
          onClick={() => onClick(0)}
          className="w-12 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs text-gray-600 font-medium hover:border-blue-500 hover:text-blue-600 transition-all"
        >
          +{remaining}
        </button>
      )}
    </div>
  );
};

interface RealVideosCellProps {
  videos: string[];
  onClick: (index: number) => void;
}

const RealVideosCell: React.FC<RealVideosCellProps> = ({ videos, onClick }) => {
  if (videos.length === 0) {
    return <span className="text-gray-400 text-xs">-</span>;
  }
  const displayVideos = videos.slice(0, 4);
  const remaining = videos.length - displayVideos.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {displayVideos.map((_: string, idx: number) => (
        <button
          key={idx}
          onClick={() => onClick(idx)}
          className="w-12 h-12 bg-gray-900 border border-gray-200 rounded overflow-hidden hover:border-blue-500 hover:shadow-sm transition-all flex items-center justify-center relative group"
        >
          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          <span className="absolute bottom-0.5 text-[9px] text-white/80">
            {idx + 1}
          </span>
        </button>
      ))}
      {remaining > 0 && (
        <button
          onClick={() => onClick(0)}
          className="w-12 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs text-gray-600 font-medium hover:border-blue-500 hover:text-blue-600 transition-all"
        >
          +{remaining}
        </button>
      )}
    </div>
  );
};

interface ValueCellProps {
  product: Product;
  field: CategoryFieldConfig;
  isAdvantage: boolean;
}

const ValueCell: React.FC<ValueCellProps> = ({ product, field, isAdvantage }) => {
  const value = product[field.key];

  const emptyVal = <span className="text-gray-400 text-xs">-</span>;

  if (field.type === 'image') {
    if (typeof value === 'string' && value) {
      return (
        <div className="w-12 h-12 bg-gray-50 rounded border border-gray-200 overflow-hidden">
          <Image
            src={value}
            alt=""
            width={48}
            height={48}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
    return emptyVal;
  }

  if (field.type === 'boolean') {
    if (value === true) {
      return (
        <span className={`inline-flex items-center ${isAdvantage ? 'text-cyan-600 font-semibold border-2 border-cyan-500 bg-cyan-50 px-2 py-0.5 rounded' : 'text-green-600'}`}>
          <Check className="w-4 h-4" />
        </span>
      );
    }
    if (value === false) {
      return (
        <span className="inline-flex items-center text-gray-400">
          <Minus className="w-4 h-4" />
        </span>
      );
    }
    return emptyVal;
  }

  if (field.type === 'number') {
    if (value === null || value === undefined || value === '') {
      return emptyVal;
    }
    const isPrice =
      field.key === 'referencePrice' ||
      field.key === 'dailyPrice' ||
      field.key === 'filterTotalCost';
    const numValue = Number(value);
    if (isPrice) {
      return (
        <span
          className={`font-semibold ${isAdvantage ? 'text-cyan-600 border-2 border-cyan-500 bg-cyan-50 px-2 py-0.5 rounded' : 'text-gray-900'}`}
        >
          ¥{numValue.toLocaleString()}
        </span>
      );
    }
    return (
      <span className={isAdvantage ? 'text-cyan-600 font-semibold border-2 border-cyan-500 bg-cyan-50 px-2 py-0.5 rounded' : 'text-gray-900'}>
        {numValue.toLocaleString()}
      </span>
    );
  }

  // string
  if (value === null || value === undefined || value === '') {
    return emptyVal;
  }
  const text = String(value);
  if (isAdvantage) {
    return (
      <span className="inline-flex items-center text-cyan-600 font-semibold border-2 border-cyan-500 bg-cyan-50 px-2 py-0.5 rounded">
        {text}
      </span>
    );
  }
  return <span className="text-gray-900">{text}</span>;
};

function getCompareValue(
  product: Product,
  field: CategoryFieldConfig,
): string {
  const value = product[field.key];
  if (field.type === 'images' || field.type === 'videos') {
    if (Array.isArray(value)) return String(value.length);
    return '';
  }
  if (value === null || value === undefined) return '';
  return String(value);
}

export default ComparePage;
