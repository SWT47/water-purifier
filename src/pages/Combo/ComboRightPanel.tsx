import React from 'react';
import {
  Save,
  RotateCcw,
  Smartphone,
  FolderOpen,
  Trash2,
  ChevronRight,
  X,
  CheckCircle,
} from 'lucide-react';
import type { Product, ComboScheme } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { productTitle } from '@/utils/format';
import { cn } from '@/utils/cn';

const MAX_ITEMS = 5;

interface ComboRightPanelProps {
  selectedProducts: Product[];
  schemeName: string;
  livePrice: string;
  currentSchemeId: string | null;
  livePriceNum: number | null;
  totalReference: number;
  totalDaily: number;
  hasDaily: boolean;
  hasReference: boolean;
  showDiff: boolean;
  diff: number;
  schemes: ComboScheme[];
  schemeDialogOpen: boolean;
  saveDialogOpen: boolean;
  onSchemeNameChange: (v: string) => void;
  onLivePriceChange: (v: string) => void;
  onClear: () => void;
  onSaveAs: () => void;
  onOverwrite: () => void;
  onConfirmSave: () => void;
  onLivePreview: () => void;
  onOpenSchemes: () => void;
  onLoadScheme: (scheme: ComboScheme) => void;
  onDeleteScheme: (id: string) => void;
  onSchemeDialogChange: (open: boolean) => void;
  onSaveDialogChange: (open: boolean) => void;
  onRemoveProduct: (id: string) => void;
  onGoSelect: () => void;
}

const ComboRightPanel: React.FC<ComboRightPanelProps> = ({
  selectedProducts,
  schemeName,
  livePrice,
  currentSchemeId,
  livePriceNum,
  totalReference,
  totalDaily,
  hasDaily,
  hasReference,
  showDiff,
  diff,
  schemes,
  schemeDialogOpen,
  saveDialogOpen,
  onSchemeNameChange,
  onLivePriceChange,
  onClear,
  onSaveAs,
  onOverwrite,
  onConfirmSave,
  onLivePreview,
  onOpenSchemes,
  onLoadScheme,
  onDeleteScheme,
  onSchemeDialogChange,
  onSaveDialogChange,
  onRemoveProduct,
  onGoSelect,
}) => {
  const dailyDisplay = hasDaily
    ? `¥${totalDaily.toLocaleString()}`
    : '—';

  const referenceDisplay = hasReference
    ? `¥${totalReference.toLocaleString()}`
    : '—';

  const savedAmount =
    livePriceNum != null && totalReference > 0 && totalReference > livePriceNum
      ? totalReference - livePriceNum
      : 0;

  return (
    <>
      <aside className="w-[360px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                已选产品
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedProducts.length}/{MAX_ITEMS} 件
                {currentSchemeId && (
                  <span className="ml-2 text-blue-600 font-medium">
                    · {schemeName}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                disabled={selectedProducts.length === 0}
                onClick={onClear}
              >
                <X className="w-3 h-3 mr-1" />
                清空
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={onOpenSchemes}
                title="已保存方案"
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/30">
          {selectedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <CheckCircle className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                还没有选择产品
              </p>
              <Button size="sm" variant="black" onClick={onGoSelect}>
                去挑选产品
              </Button>
            </div>
          ) : (
            selectedProducts.map((p: Product, idx: number) => (
              <div
                key={p.id}
                className="bg-white rounded-md border border-gray-200 p-2.5 flex gap-2.5 items-start hover:shadow-sm hover:border-gray-300 transition-all group"
              >
                <div className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-1">
                  {idx + 1}
                </div>
                <div className="w-12 h-12 rounded border border-gray-100 bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {p.whiteBgImage ? (
                    <img
                      src={p.whiteBgImage}
                      alt={productTitle(p)}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400">无图</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-500 mb-0.5">
                    {p.brand || '未知品牌'}
                  </div>
                  <h3
                    className="text-xs font-medium text-gray-900 leading-tight truncate"
                    title={productTitle(p)}
                  >
                    {productTitle(p)}
                  </h3>
                  {p.referencePrice != null && (
                    <div className="text-sm font-bold text-blue-600 mt-0.5">
                      ¥{Number(p.referencePrice).toLocaleString()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onRemoveProduct(p.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                  title="移除"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Price section */}
        <div className="border-t border-gray-200 p-4 bg-white">
          {selectedProducts.length > 0 ? (
            <div className="space-y-3">
              {/* 方案名 */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">方案名称</Label>
                <Input
                  value={schemeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onSchemeNameChange(e.target.value)
                  }
                  placeholder="请输入方案名称"
                  className="h-8 text-sm"
                />
              </div>

              {/* 价格汇总 */}
              <div className="bg-gray-50 rounded-md p-3 space-y-2 border border-gray-100">
                {hasDaily && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">日常总价</span>
                    <span className="font-medium text-gray-700">
                      {dailyDisplay}
                    </span>
                  </div>
                )}
                {hasReference && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">参考总价</span>
                    <span className="text-lg font-bold text-blue-600">
                      {referenceDisplay}
                    </span>
                  </div>
                )}
              </div>

              {/* 直播优惠价输入框 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">
                  直播专属优惠价
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 font-bold text-lg pointer-events-none">
                    ¥
                  </span>
                  <Input
                    type="number"
                    value={livePrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onLivePriceChange(e.target.value)
                    }
                    placeholder="请输入直播优惠价"
                    className="h-11 text-base font-bold text-orange-600 bg-orange-50/60 border-orange-200 pl-8 placeholder:text-orange-300 focus-visible:ring-orange-400/40 focus-visible:border-orange-400"
                  />
                </div>
                {savedAmount > 0 && (
                  <div className="flex items-center justify-between text-xs bg-gradient-to-r from-orange-500/10 to-red-500/10 px-3 py-2 rounded border border-orange-200/50">
                    <span className="text-orange-600 font-medium">
                      立省
                    </span>
                    <span className="font-bold text-orange-600 text-sm">
                      ¥{savedAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                {showDiff && livePriceNum == null && (
                  <div className="flex items-center justify-between text-xs bg-blue-50 px-3 py-1.5 rounded">
                    <span className="text-blue-600">日常/参考 差额</span>
                    <span className="font-semibold text-blue-600">
                      ¥{diff.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-9"
                  disabled={selectedProducts.length === 0}
                  onClick={onSaveAs}
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  保存方案
                </Button>
                <Button
                  size="sm"
                  variant="black"
                  className="text-xs h-9"
                  disabled={selectedProducts.length === 0}
                  onClick={onLivePreview}
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1" />
                  直播预览
                </Button>
              </div>
              {currentSchemeId && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={onOverwrite}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    覆盖保存
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('确定删除当前方案？')) {
                        onDeleteScheme(currentSchemeId);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    删除方案
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-gray-400 py-4">
              选择产品后显示价格汇总
            </div>
          )}
        </div>
      </aside>

      {/* Save as dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={onSaveDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>保存搭配方案</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700">方案名称</Label>
              <Input
                value={schemeName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onSchemeNameChange(e.target.value)
                }
                placeholder="请输入方案名称"
                className="h-9"
                autoFocus
              />
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>已选产品：{selectedProducts.length} 件</div>
              <div>参考总价：{referenceDisplay}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onSaveDialogChange(false)}>
              取消
            </Button>
            <Button variant="black" onClick={onConfirmSave}>
              确认保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheme list dialog */}
      <Dialog open={schemeDialogOpen} onOpenChange={onSchemeDialogChange}>
        <DialogContent className="max-w-lg w-[90vw]">
          <DialogHeader>
            <DialogTitle>已保存的方案</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {schemes.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                暂无保存的方案
              </div>
            ) : (
              <div className="space-y-2">
                {schemes.map((s: ComboScheme) => (
                  <div
                    key={s.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-md border transition-colors',
                      currentSchemeId === s.id
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {s.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {s.productIds?.length || 0} 件产品
                        {s.livePrice != null && (
                          <span className="ml-2 text-orange-600 font-medium">
                            直播价 ¥{Number(s.livePrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="black"
                        className="text-xs h-8"
                        onClick={() => onLoadScheme(s)}
                      >
                        加载
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50"
                        onClick={() => onDeleteScheme(s.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onSchemeDialogChange(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ComboRightPanel;
