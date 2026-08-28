import React from 'react';
import { Save, RotateCcw, Smartphone, FolderOpen } from 'lucide-react';
import type { Product, ComboScheme } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

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
  children: React.ReactNode;
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
  children,
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
      <aside className="w-[380px] flex-shrink-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col text-white">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                直播搭配方案
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                已选 {selectedProducts.length}/{MAX_ITEMS} 款
                {currentSchemeId && (
                  <span className="ml-2 text-cyan-400">· {schemeName}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 text-white/70 border-white/20 bg-transparent hover:bg-white/10 hover:text-white"
                disabled={selectedProducts.length === 0}
                onClick={onClear}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                清空
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 text-white/70 border-white/20 bg-transparent hover:bg-white/10 hover:text-white"
                onClick={onOpenSchemes}
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1" />
                方案
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">{children}</div>

        <div className="border-t border-white/10 p-4 bg-slate-900/60">
          {selectedProducts.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-white/50">方案名称</Label>
                <Input
                  value={schemeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onSchemeNameChange(e.target.value)
                  }
                  placeholder="输入方案名称"
                  className="h-8 text-sm bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-cyan-400/50"
                />
              </div>

              {hasDaily && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">日常总价</span>
                  <span className="font-medium text-white/80">
                    {dailyDisplay}
                  </span>
                </div>
              )}
              {hasReference && (
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">参考总价</span>
                  <span className="text-xl font-bold text-white">
                    {referenceDisplay}
                  </span>
                </div>
              )}

              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <Label className="text-xs text-white/50">直播优惠价</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 font-bold text-lg pointer-events-none">
                    ¥
                  </span>
                  <Input
                    type="number"
                    value={livePrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onLivePriceChange(e.target.value)
                    }
                    placeholder="请输入直播优惠价"
                    className="h-10 text-base font-bold text-red-400 bg-white/5 border-white/15 pl-8 placeholder:text-white/30 focus-visible:ring-red-400/50 focus-visible:border-red-400/50"
                  />
                </div>
                {savedAmount > 0 && (
                  <div className="flex items-center justify-between text-xs bg-red-500/15 px-3 py-1.5 rounded">
                    <span className="text-red-400">立省</span>
                    <span className="font-semibold text-red-400">
                      ¥{savedAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                {showDiff && livePriceNum == null && (
                  <div className="flex items-center justify-between text-xs bg-cyan-500/15 px-3 py-1.5 rounded">
                    <span className="text-cyan-400">日常vs参考 差额</span>
                    <span className="font-semibold text-cyan-400">
                      ¥{diff.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 text-white/70 border-white/20 bg-transparent hover:bg-white/10 hover:text-white"
                  disabled={selectedProducts.length === 0}
                  onClick={onSaveAs}
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  保存方案
                </Button>
                <Button
                  size="sm"
                  variant="cyan"
                  className="text-xs h-9"
                  disabled={selectedProducts.length === 0}
                  onClick={onLivePreview}
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1" />
                  直播展示
                </Button>
              </div>
              {currentSchemeId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs text-white/70 border-white/20 bg-transparent hover:bg-white/10 hover:text-white mt-1"
                  disabled={selectedProducts.length === 0}
                  onClick={onOverwrite}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  覆盖当前方案
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center text-white/40 text-sm py-2">
              选择产品后显示总价
            </div>
          )}
        </div>
      </aside>

      <Dialog open={saveDialogOpen} onOpenChange={onSaveDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>保存方案</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm">方案名称</Label>
            <Input
              value={schemeName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onSchemeNameChange(e.target.value)
              }
              placeholder="请输入方案名称"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onSaveDialogChange(false)}>
              取消
            </Button>
            <Button variant="black" onClick={onConfirmSave}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={schemeDialogOpen} onOpenChange={onSchemeDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>加载方案</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {schemes.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                暂无保存的方案
              </div>
            ) : (
              schemes.map((s: ComboScheme) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {s.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {s.productIds?.length || 0} 款产品
                      {s.livePrice != null &&
                        ` · 直播价 ¥${Number(s.livePrice).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => onLoadScheme(s)}
                    >
                      加载
                    </Button>
                    <button
                      className="p-1.5 text-gray-400 hover:text-red-600"
                      onClick={() => onDeleteScheme(s.id)}
                      title="删除方案"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ComboRightPanel;
