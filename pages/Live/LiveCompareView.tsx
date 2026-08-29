import React, { useCallback, useMemo, useState } from 'react';
import { Image } from '@client/src/components/ui/image';
import {
  CATEGORY_FIELDS,
  CATEGORY_LABELS,
} from '@client/src/utils/categories';
import type {
  Product,
  ProductCategory,
  CategoryFieldConfig,
} from '@shared/api.interface';
import {
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  VideoIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@client/src/components/ui/dialog';

const MAX_COMPARE = 4;

const ADVANTAGE_LOWER_KEYS = new Set([
  'dailyPrice',
  'referencePrice',
  'filterTotalCost',
]);

const ADVANTAGE_HIGHER_KEYS = new Set(['flux', 'launchYear', 'waterFlowRate']);

const ADVANTAGE_WATERMODE_KEY = 'waterMode';

interface LiveCompareViewProps {
  category: ProductCategory;
  products: Product[];
  onClose: () => void;
  onRemoveProduct?: (productId: string) => void;
}

function formatValue(value: unknown, type: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'boolean') return value ? '是' : '否';
  if (type === 'number') {
    const n = Number(value);
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString();
  }
  return String(value);
}

const LiveCompareView: React.FC<LiveCompareViewProps> = ({
  category,
  products,
  onClose,
  onRemoveProduct,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxProductIdx, setLightboxProductIdx] = useState(0);
  const [lightboxImgIdx, setLightboxImgIdx] = useState(0);

  const [videoOpen, setVideoOpen] = useState(false);
  const [videoProductIdx, setVideoProductIdx] = useState(0);
  const [videoIdx, setVideoIdx] = useState(0);

  const fields = CATEGORY_FIELDS[category].filter(
    (f: CategoryFieldConfig) =>
      f.key !== 'whiteBgImage' &&
      f.key !== 'realImages' &&
      f.key !== 'realVideos',
  );

  const priceFields: CategoryFieldConfig[] = [];
  const otherFields: CategoryFieldConfig[] = [];
  fields.forEach((f: CategoryFieldConfig) => {
    if (f.key === 'dailyPrice' || f.key === 'referencePrice') {
      priceFields.push(f);
    } else {
      otherFields.push(f);
    }
  });

  const displayProducts = products.slice(0, MAX_COMPARE);
  const productCount = displayProducts.length;

  const hasRealImages = useMemo(
    () =>
      displayProducts.some(
        (p: Product) => (p.realImages?.length ?? 0) > 0,
      ),
    [displayProducts],
  );

  const hasRealVideos = useMemo(
    () =>
      displayProducts.some(
        (p: Product) => (p.realVideos?.length ?? 0) > 0,
      ),
    [displayProducts],
  );

  const getAdvantageIndex = useCallback(
    (field: CategoryFieldConfig): number | null => {
      if (displayProducts.length < 2) return null;
      const key = field.key as string;
      const values = displayProducts.map((p: Product) => p[field.key]);

      if (ADVANTAGE_LOWER_KEYS.has(key)) {
        const nums = values.map((v) =>
          v === null || v === undefined || v === '' ? null : Number(v),
        );
        const validNums = nums.filter((n) => n !== null) as number[];
        if (validNums.length < 2) return null;
        const min = Math.min(...validNums);
        const minIdx = nums.findIndex((n) => n === min);
        if (minIdx === -1) return null;
        const tieCount = nums.filter((n) => n === min).length;
        return tieCount === 1 ? minIdx : null;
      }

      if (ADVANTAGE_HIGHER_KEYS.has(key)) {
        const nums = values.map((v) => {
          if (v === null || v === undefined || v === '') return null;
          const s = String(v).replace(/[^0-9.]/g, '');
          const n = parseFloat(s);
          return Number.isNaN(n) ? null : n;
        });
        const validNums = nums.filter((n) => n !== null) as number[];
        if (validNums.length < 2) return null;
        const max = Math.max(...validNums);
        const maxIdx = nums.findIndex((n) => n === max);
        if (maxIdx === -1) return null;
        const tieCount = nums.filter((n) => n === max).length;
        return tieCount === 1 ? maxIdx : null;
      }

      if (key === ADVANTAGE_WATERMODE_KEY) {
        const strs = values.map((v) => String(v || ''));
        const goodIdx = strs.findIndex(
          (s) => s.includes('/') || s.includes('双') || s.includes('两'),
        );
        if (goodIdx === -1) return null;
        const goodCount = strs.filter(
          (s) => s.includes('/') || s.includes('双') || s.includes('两'),
        ).length;
        return goodCount === 1 ? goodIdx : null;
      }

      return null;
    },
    [displayProducts],
  );

  const openLightbox = (pIdx: number, imgIdx: number) => {
    setLightboxProductIdx(pIdx);
    setLightboxImgIdx(imgIdx);
    setLightboxOpen(true);
  };

  const prevImg = () => {
    const imgs = displayProducts[lightboxProductIdx]?.realImages ?? [];
    if (imgs.length === 0) return;
    setLightboxImgIdx((prev) =>
      prev === 0 ? imgs.length - 1 : prev - 1,
    );
  };

  const nextImg = () => {
    const imgs = displayProducts[lightboxProductIdx]?.realImages ?? [];
    if (imgs.length === 0) return;
    setLightboxImgIdx((prev) =>
      prev === imgs.length - 1 ? 0 : prev + 1,
    );
  };

  const openVideo = (pIdx: number, vIdx: number) => {
    setVideoProductIdx(pIdx);
    setVideoIdx(vIdx);
    setVideoOpen(true);
  };

  const prevVideo = () => {
    const vs = displayProducts[videoProductIdx]?.realVideos ?? [];
    if (vs.length === 0) return;
    setVideoIdx((prev) => (prev === 0 ? vs.length - 1 : prev - 1));
  };

  const nextVideo = () => {
    const vs = displayProducts[videoProductIdx]?.realVideos ?? [];
    if (vs.length === 0) return;
    setVideoIdx((prev) => (prev === vs.length - 1 ? 0 : prev + 1));
  };

  const lightboxImages =
    displayProducts[lightboxProductIdx]?.realImages ?? [];
  const videoList = displayProducts[videoProductIdx]?.realVideos ?? [];

  const dimColWidth = '100px';
  const gridTemplate = `minmax(${dimColWidth}, auto) repeat(${productCount}, minmax(0, 1fr))`;

  const renderValue = (
    p: Product,
    field: CategoryFieldConfig,
    isAdvantage: boolean,
  ) => {
    const val = p[field.key];
    const isPrice =
      field.key === 'referencePrice' ||
      field.key === 'dailyPrice' ||
      field.key === 'filterTotalCost';

    if (val === null || val === undefined || val === '') {
      return <span className="text-gray-400 text-xs">—</span>;
    }

    if (field.type === 'boolean') {
      if (val === true) {
        return (
          <span
            className={
              isAdvantage
                ? 'text-cyan-600 font-semibold border-2 border-cyan-500 bg-cyan-50 px-1.5 py-0.5 rounded text-xs'
                : 'text-gray-900 text-xs'
            }
          >
            是
          </span>
        );
      }
      return <span className="text-gray-500 text-xs">否</span>;
    }

    if (isPrice) {
      const num = Number(val);
      return (
        <span
          className={`font-semibold ${isAdvantage ? 'text-cyan-600 border-2 border-cyan-500 bg-cyan-50 px-1.5 py-0.5 rounded text-xs' : 'text-gray-900 text-xs'}`}
        >
          ¥{num.toLocaleString()}
        </span>
      );
    }

    const text = formatValue(val, field.type);
    if (isAdvantage) {
      return (
        <span className="text-cyan-600 font-semibold border-2 border-cyan-500 bg-cyan-50 px-1.5 py-0.5 rounded text-xs text-center">
          {text}
        </span>
      );
    }
    return <span className="text-gray-900 text-xs text-center">{text}</span>;
  };

  const headerPrice = (p: Product) => {
    if (p.referencePrice !== null && p.referencePrice !== undefined) {
      return `¥${Number(p.referencePrice).toLocaleString()}`;
    }
    if (p.dailyPrice !== null && p.dailyPrice !== undefined) {
      return `¥${Number(p.dailyPrice).toLocaleString()}`;
    }
    return '价格待定';
  };

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50">
        {/* 顶部栏 */}
        <div className="flex-shrink-0 bg-black text-white flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-semibold">
            产品对比 · {CATEGORY_LABELS[category]}
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-white/80 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
            关闭
          </button>
        </div>

        {/* 产品图片 + 名称 + 价格 区（固定顶部） */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-10 relative">
          <div
            className="grid gap-2 p-2"
            style={{
              gridTemplateColumns: `repeat(${productCount}, minmax(0, 1fr))`,
            }}
          >
            {displayProducts.map((p: Product) => (
              <div
                key={p.id}
                className="flex flex-col items-center gap-1 relative"
              >
                {onRemoveProduct && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveProduct(p.id);
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 z-10"
                    aria-label="移除"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
                <div className="w-full aspect-square bg-white border border-gray-100 rounded flex items-center justify-center p-1">
                  {p.whiteBgImage ? (
                    <Image
                      src={p.whiteBgImage}
                      alt={p.name || p.model || ''}
                      className="w-full h-full object-contain"
                      width={120}
                      height={120}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">暂无图</span>
                  )}
                </div>
                <div className="text-center w-full min-h-0">
                  <div className="text-[10px] text-gray-500 leading-tight">
                    {p.brand || '—'}
                  </div>
                  <div className="text-xs font-semibold text-gray-900 leading-tight truncate">
                    {p.name || p.model || '产品'}
                  </div>
                  <div className="text-sm font-bold text-gray-900 leading-tight mt-0.5">
                    {headerPrice(p)}
                  </div>
                </div>
              </div>
            ))}
            {productCount === 0 && (
              <div className="flex items-center justify-center aspect-square bg-gray-50 border border-dashed border-gray-300 rounded text-sm text-gray-400">
                待选择
              </div>
            )}
          </div>
        </div>

        {/* 可滚动参数列表 */}
        <div className="flex-1 overflow-y-auto">
          {/* 价格相关行 */}
          {priceFields.map((field: CategoryFieldConfig) => {
            const advIdx = getAdvantageIndex(field);
            return (
              <div
                key={String(field.key)}
                className="grid border-b border-gray-100 bg-white"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div className="px-2 py-2 text-[12px] text-gray-900 font-bold bg-gray-100/80 tracking-wide flex items-center border-r border-gray-200">
                  {field.label}
                </div>
                {displayProducts.map((p: Product, pIdx: number) => (
                  <div
                    key={p.id}
                    className="px-1 py-2 flex items-center justify-center border-r border-gray-200 last:border-r-0"
                  >
                    {renderValue(p, field, advIdx === pIdx)}
                  </div>
                ))}
              </div>
            );
          })}

          {/* 其他参数行 */}
          {otherFields.map((field: CategoryFieldConfig, idx: number) => {
            const advIdx = getAdvantageIndex(field);
            return (
              <div
                key={String(field.key)}
                className={[
                  'grid border-b border-gray-100',
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                ].join(' ')}
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div className="px-2 py-2 text-[12px] text-gray-900 font-bold bg-gray-100/80 tracking-wide flex items-center border-r border-gray-200">
                  {field.label}
                </div>
                {displayProducts.map((p: Product, pIdx: number) => (
                  <div
                    key={p.id}
                    className="px-1 py-2 flex items-center justify-center border-r border-gray-200 last:border-r-0"
                  >
                    {renderValue(p, field, advIdx === pIdx)}
                  </div>
                ))}
              </div>
            );
          })}

          {/* 产品实拍图行 */}
          {hasRealImages && (
            <div
              className="grid border-b border-gray-100 bg-white"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <div className="px-2 py-2 text-[12px] text-gray-900 font-bold bg-gray-100/80 tracking-wide flex items-center gap-1 border-r border-gray-200">
                <ImageIcon className="w-3.5 h-3.5" />
                实拍图
              </div>
              {displayProducts.map((p: Product, pIdx: number) => (
                <div
                  key={p.id}
                  className="px-1 py-2 flex items-center justify-center border-r border-gray-200 last:border-r-0"
                >
                  <LiveRealImagesCell
                    images={p.realImages ?? []}
                    onClick={(imgIdx) => openLightbox(pIdx, imgIdx)}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 产品实拍视频行 */}
          {hasRealVideos && (
            <div
              className="grid bg-white"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <div className="px-2 py-2 text-[12px] text-gray-900 font-bold bg-gray-100/80 tracking-wide flex items-center gap-1 border-r border-gray-200">
                <VideoIcon className="w-3.5 h-3.5" />
                实拍视频
              </div>
              {displayProducts.map((p: Product, pIdx: number) => (
                <div
                  key={p.id}
                  className="px-1 py-2 flex items-center justify-center border-r border-gray-200 last:border-r-0"
                >
                  <LiveRealVideosCell
                    videos={p.realVideos ?? []}
                    onClick={(vIdx) => openVideo(pIdx, vIdx)}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="h-3" />
        </div>
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
                onClick={prevImg}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20"
                aria-label="上一张"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImg}
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
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 max-w-[80vw] overflow-x-auto py-2 px-2 bg-black/40 rounded-md">
              {lightboxImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setLightboxImgIdx(idx)}
                  className={`w-14 h-14 flex-shrink-0 border-2 rounded overflow-hidden transition-colors ${
                    idx === lightboxImgIdx
                      ? 'border-cyan-500'
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
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="bg-black/90 border-0 p-0 max-w-none w-screen h-screen m-0 rounded-none flex flex-col items-center justify-center">
          <button
            onClick={() => setVideoOpen(false)}
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
            <video
              key={`${videoProductIdx}-${videoIdx}`}
              src={videoList[videoIdx]}
              controls
              autoPlay
              className="w-full aspect-video bg-black rounded-md"
            />
          </div>
          {videoList.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 max-w-[80vw] overflow-x-auto py-2 px-2 bg-black/40 rounded-md">
              {videoList.map((_: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setVideoIdx(idx)}
                  className={`w-14 h-14 flex-shrink-0 border-2 rounded overflow-hidden transition-colors bg-gray-800 flex items-center justify-center relative ${
                    idx === videoIdx
                      ? 'border-cyan-500'
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
            {videoIdx + 1} / {videoList.length}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface LiveRealImagesCellProps {
  images: string[];
  onClick: (index: number) => void;
  size?: 'sm' | 'md';
}

const LiveRealImagesCell: React.FC<LiveRealImagesCellProps> = ({
  images,
  onClick,
  size = 'md',
}) => {
  if (images.length === 0) {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  const displayImages = images.slice(0, size === 'sm' ? 2 : 3);
  const remaining = images.length - displayImages.length;
  const tileSize = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {displayImages.map((img: string, idx: number) => (
        <button
          key={idx}
          onClick={() => onClick(idx)}
          className={`${tileSize} bg-white border border-gray-200 rounded overflow-hidden hover:border-cyan-500 transition-all`}
        >
          <Image
            src={img}
            alt={`实拍图 ${idx + 1}`}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
      {remaining > 0 && (
        <button
          onClick={() => onClick(0)}
          className={`${tileSize} bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[10px] text-gray-600 font-medium hover:border-cyan-500 hover:text-cyan-600 transition-all`}
        >
          +{remaining}
        </button>
      )}
    </div>
  );
};

interface LiveRealVideosCellProps {
  videos: string[];
  onClick: (index: number) => void;
  size?: 'sm' | 'md';
}

const LiveRealVideosCell: React.FC<LiveRealVideosCellProps> = ({
  videos,
  onClick,
  size = 'md',
}) => {
  if (videos.length === 0) {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  const displayVideos = videos.slice(0, size === 'sm' ? 2 : 3);
  const remaining = videos.length - displayVideos.length;
  const tileSize = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {displayVideos.map((_: string, idx: number) => (
        <button
          key={idx}
          onClick={() => onClick(idx)}
          className={`${tileSize} bg-gray-900 border border-gray-200 rounded overflow-hidden hover:border-cyan-500 transition-all flex items-center justify-center relative`}
        >
          <Play className="w-3 h-3 text-white fill-white ml-0.5" />
          <span className="absolute bottom-0.5 text-[8px] text-white/80">
            {idx + 1}
          </span>
        </button>
      ))}
      {remaining > 0 && (
        <button
          onClick={() => onClick(0)}
          className={`${tileSize} bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[10px] text-gray-600 font-medium hover:border-cyan-500 hover:text-cyan-600 transition-all`}
        >
          +{remaining}
        </button>
      )}
    </div>
  );
};

export default LiveCompareView;
