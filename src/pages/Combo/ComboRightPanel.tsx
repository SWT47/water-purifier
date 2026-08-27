import React from 'react';
import { Save, RotateCcw, Smartphone, Trash2, FolderOpen } from 'lucide-react';
import type { Product, ComboScheme } from '@/types';
import { formatPrice } from '@/utils/format';
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
  return (
    <>
      <aside className="w-[360px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                搭配方案
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                已选 {selectedProducts.length}/{MAX_ITEMS} 款
                {currentSchemeId && (
                  <span className="ml-2 text-cyan-600">· {schemeName}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 text-gray-600"
                disabled={selectedProducts.length === 0}
                onClick={onClear}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                清空
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 text-gray-600"
                onClick={onOpenSchemes}
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1" />
                方案
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">{children}</div>

        <div className="border-t border-gray-200 p-4 bg-white">
          {selectedProducts.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">方案名称</Label>
                <Input
                  value={schemeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onSchemeNameChange(e.target.value)
                  }
                  placeholder="输入方案名称"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">直播价 (可选)</Label>
                <Input
                  type="number"
                  value={livePrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onLivePriceChange(e.target.value)
                  }
                  placeholder="设置直播价"
                  className="h-8 text-sm"
                />
              </div>

              {hasDaily && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">日常总价</span>
                  <span className="font-medium text-gray-700">
                    {formatPrice(totalDaily)}
                  </span>
                </div>
              )}
              {hasReference && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">参考总价</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(totalReference)}
                  </span>
                </div>
              )}
              {showDiff && (
                <div className="flex items-center justify-between text-xs bg-red-50 px-3 py-1.5 rounded">
                  <span className="text-red-600">优惠差额</span>
                  <span className="font-semibold text-red-600">
                    省 ¥{diff.toLocaleString()}
                  </span>
                </div>
              )}
              {livePriceNum !== null && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-sm text-gray-600">直播价</span>
                  <span className="text-xl font-bold text-red-600">
                    ¥{livePriceNum.toLocaleString()}
                  </span>
                </div>
              )}

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
                {currentSchemeId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-9"
                    disabled={selectedProducts.length === 0}
                    onClick={onOverwrite}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    覆盖保存
                  </Button>
                ) : (
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
                )}
              </div>
              {currentSchemeId && (
                <Button
                  variant="cyan"
                  className="w-full h-9 text-sm"
                  disabled={selectedProducts.length === 0}
                  onClick={onLivePreview}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  直播展示搭配方案
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-2">
              选择产品后显示总价
            </div>
          )}
        </div>
      </aside>

      {/* Save dialog */}
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

      {/* Scheme list dialog */}
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
                      {s.livePrice != null && ` · 直播价 ¥${s.livePrice}`}
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
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
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
