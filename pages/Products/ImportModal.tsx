import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import type {
  CategoryFieldConfig,
  ImportResult,
  ProductCategory,
  ProductCreateInput,
} from '@shared/api.interface';
import { CATEGORY_FIELDS } from '@shared/api.interface';
import { CATEGORY_EXCEL_COLUMN_MAP, CATEGORY_LABELS } from '@client/src/utils/categories';
import { importProducts } from '@client/src/api/products';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory: ProductCategory;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'importing' | 'result';

const IGNORE_VALUE = '__ignore__';

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === '是' || v === 'true' || v === '1' || v === 'yes' || v === 'y';
  }
  return false;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v: unknown) => String(v).trim());
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,;，；]/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export default function ImportModal({
  open,
  onOpenChange,
  defaultCategory,
  onSuccess,
}: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [category, setCategory] = useState<ProductCategory>(defaultCategory);
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorList, setErrorList] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryFields: CategoryFieldConfig[] = useMemo(
    () => CATEGORY_FIELDS[category] ?? [],
    [category],
  );

  const fieldLabelMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of categoryFields) {
      map[f.key as string] = f.label;
    }
    return map;
  }, [categoryFields]);

  const requiredFields = useMemo(() => {
    return categoryFields.filter((f: CategoryFieldConfig) => {
      const key = f.key as string;
      return key === 'brand' || key === 'model' || key === 'name';
    });
  }, [categoryFields]);

  const matchedFieldKeys = useMemo(() => {
    return new Set(Object.values(columnMapping).filter((v: string) => v !== IGNORE_VALUE));
  }, [columnMapping]);

  const missingRequiredFields = useMemo(() => {
    return requiredFields.filter(
      (f: CategoryFieldConfig) => !matchedFieldKeys.has(f.key as string),
    );
  }, [requiredFields, matchedFieldKeys]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setStep('upload');
      setFileName('');
      setHeaders([]);
      setPreviewRows([]);
      setAllRows([]);
      setColumnMapping({});
      setImportResult(null);
      setErrorList([]);
    }
  }, [open, defaultCategory]);

  // Re-run auto matching when category changes (after file loaded)
  useEffect(() => {
    if (headers.length === 0) return;
    const mapping = autoMatchColumns(headers, category);
    setColumnMapping(mapping);
  }, [category, headers]);

  const autoMatchColumns = useCallback(
    (headerList: string[], cat: ProductCategory): Record<number, string> => {
      const colMap = CATEGORY_EXCEL_COLUMN_MAP[cat] ?? {};
      const mapping: Record<number, string> = {};
      const usedKeys = new Set<string>();

      headerList.forEach((header: string, idx: number) => {
        const trimmed = header.trim();
        // Exact match
        if (colMap[trimmed] && !usedKeys.has(colMap[trimmed])) {
          mapping[idx] = colMap[trimmed];
          usedKeys.add(colMap[trimmed]);
          return;
        }
        // Fuzzy: try to match by stripping spaces/case
        const normalized = trimmed.replace(/\s+/g, '').toLowerCase();
        for (const [cnName, fieldKey] of Object.entries(colMap)) {
          if (usedKeys.has(fieldKey)) continue;
          const cnNorm = cnName.replace(/\s+/g, '').toLowerCase();
          if (normalized === cnNorm || normalized.includes(cnNorm) || cnNorm.includes(normalized)) {
            mapping[idx] = fieldKey;
            usedKeys.add(fieldKey);
            return;
          }
        }
        mapping[idx] = IGNORE_VALUE;
      });

      return mapping;
    },
    [],
  );

  const parseFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('请上传 .xlsx 或 .xls 格式的 Excel 文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
          header: 1,
          defval: '',
          raw: false,
        });

        if (jsonData.length === 0) {
          toast.error('Excel 文件为空');
          return;
        }

        const headerRow = (jsonData[0] as string[]).map((v: string) => String(v ?? '').trim());
        const dataRows = jsonData.slice(1).filter((row: unknown) => {
          return Array.isArray(row) && row.some((cell: unknown) => String(cell ?? '').trim());
        }) as string[][];

        if (headerRow.every((h: string) => h === '')) {
          toast.error('未检测到表头，请检查 Excel 第一行');
          return;
        }

        setFileName(file.name);
        setHeaders(headerRow);
        setAllRows(dataRows);
        setPreviewRows(dataRows.slice(0, 5));
        setColumnMapping(autoMatchColumns(headerRow, category));
        setStep('mapping');
      } catch (error) {
        logger.error('解析 Excel 文件失败', error);
        toast.error('解析 Excel 文件失败，请检查文件格式');
      }
    };
    reader.onerror = () => {
      toast.error('读取文件失败');
    };
    reader.readAsBinaryString(file);
  }, [category, autoMatchColumns]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
      // Reset so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [parseFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategory(value as ProductCategory);
  }, []);

  const handleColumnMapChange = useCallback((colIndex: number, fieldKey: string) => {
    setColumnMapping((prev) => ({ ...prev, [colIndex]: fieldKey }));
  }, []);

  const handleResetFile = useCallback(() => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setPreviewRows([]);
    setAllRows([]);
    setColumnMapping({});
    setImportResult(null);
    setErrorList([]);
  }, []);

  const buildProductRow = useCallback(
    (row: string[]): ProductCreateInput => {
      const product: Partial<ProductCreateInput> = { category };

      for (let colIdx = 0; colIdx < headers.length; colIdx += 1) {
        const fieldKey = columnMapping[colIdx];
        if (!fieldKey || fieldKey === IGNORE_VALUE) continue;

        const fieldConfig = categoryFields.find(
          (f: CategoryFieldConfig) => (f.key as string) === fieldKey,
        );
        const rawValue = row[colIdx] ?? '';
        const key = fieldKey as keyof ProductCreateInput;

        if (!fieldConfig) {
          (product as Record<string, unknown>)[fieldKey] = rawValue;
          continue;
        }

        switch (fieldConfig.type) {
          case 'boolean':
            (product as Record<string, unknown>)[key as string] = parseBoolean(rawValue);
            break;
          case 'number':
            (product as Record<string, unknown>)[key as string] = parseNumber(rawValue);
            break;
          case 'images':
          case 'videos':
            (product as Record<string, unknown>)[key as string] = parseArray(rawValue);
            break;
          case 'image':
          case 'string':
          default: {
            const strVal = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue);
            (product as Record<string, unknown>)[key as string] = strVal || null;
            break;
          }
        }
      }

      return product as ProductCreateInput;
    },
    [headers, columnMapping, category, categoryFields],
  );

  const handleImport = useCallback(async () => {
    if (allRows.length === 0) {
      toast.error('没有可导入的数据');
      return;
    }

    if (missingRequiredFields.length > 0) {
      toast.error(
        `缺少必填字段：${missingRequiredFields.map((f: CategoryFieldConfig) => f.label).join('、')}`,
      );
      return;
    }

    setStep('importing');
    setErrorList([]);

    try {
      const products: ProductCreateInput[] = allRows.map((row: string[], idx: number) =>
        buildProductRow(row),
      );

      const response = await importProducts(category, products);

      if (response.success) {
        setImportResult(response.data);
        setStep('result');
        if (response.data.failed === 0) {
          toast.success(`成功导入 ${response.data.success} 条数据`);
        } else {
          toast.warning(
            `导入完成：成功 ${response.data.success} 条，失败 ${response.data.failed} 条`,
          );
        }
        if (response.data.success > 0) {
          onSuccess();
        }
      } else {
        toast.error(response.message || '导入失败');
        setStep('mapping');
      }
    } catch (error) {
      logger.error('导入产品异常', error);
      toast.error('导入失败，请稍后重试');
      setStep('mapping');
    }
  }, [allRows, missingRequiredFields, buildProductRow, category, onSuccess]);

  const handleClose = useCallback(() => {
    if (step === 'importing') return;
    onOpenChange(false);
  }, [step, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        showCloseButton={step !== 'importing'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            批量导入产品
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className={step === 'upload' ? 'text-black font-medium' : ''}>1. 上传文件</span>
          <ArrowRight className="w-4 h-4" />
          <span className={step === 'mapping' ? 'text-black font-medium' : ''}>2. 字段匹配</span>
          <ArrowRight className="w-4 h-4" />
          <span className={step === 'importing' ? 'text-black font-medium' : ''}>3. 导入</span>
          <ArrowRight className="w-4 h-4" />
          <span className={step === 'result' ? 'text-black font-medium' : ''}>4. 结果</span>
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-20">选择类目</label>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="选择类目" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(
                      (cat: ProductCategory) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-black bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-base font-medium text-gray-700 mb-1">
                  拖拽 Excel 文件到此处，或点击选择文件
                </p>
                <p className="text-sm text-gray-500">支持 .xlsx、.xls 格式</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">导入说明</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-700">
                  <li>第一行为表头，系统将根据表头自动匹配字段</li>
                  <li>支持品牌、型号等基础信息及价格、参数等</li>
                  <li>布尔字段填写"是/否"、"true/false"或"1/0"</li>
                  <li>多图/多视频字段用逗号或分号分隔多个链接</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Mapping + Preview */}
          {step === 'mapping' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">类目</label>
                  <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="选择类目" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(
                        (cat: ProductCategory) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{fileName}</span>
                  <span className="mx-2">·</span>
                  共 {allRows.length} 行数据
                </div>
              </div>

              {missingRequiredFields.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-2 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">以下必填字段未匹配：</p>
                    <p className="text-xs mt-0.5">
                      {missingRequiredFields.map((f: CategoryFieldConfig) => f.label).join('、')}
                    </p>
                  </div>
                </div>
              )}

              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="text-left font-medium px-3 py-2 w-[30%]">Excel 列名</th>
                      <th className="text-left font-medium px-3 py-2 w-[30%]">匹配字段</th>
                      <th className="text-left font-medium px-3 py-2">示例值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((header: string, colIdx: number) => {
                      const mappedKey = columnMapping[colIdx];
                      const isRequired = requiredFields.some(
                        (f: CategoryFieldConfig) =>
                          (f.key as string) === mappedKey && mappedKey !== IGNORE_VALUE,
                      );
                      const isMissingRequired =
                        mappedKey === IGNORE_VALUE &&
                        requiredFields.length > 0 &&
                        missingRequiredFields.some(
                          (f: CategoryFieldConfig) =>
                            fieldLabelMap[f.key as string] === header || header.includes(f.label),
                        );
                      const sampleValue = previewRows[0]?.[colIdx] ?? '';

                      return (
                        <tr
                          key={colIdx}
                          className={`border-t border-gray-100 ${
                            mappedKey === IGNORE_VALUE ? 'bg-gray-50' : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-gray-700">
                            {header || <span className="text-gray-400">(空列)</span>}
                          </td>
                          <td className="px-3 py-2">
                            <Select
                              value={mappedKey || IGNORE_VALUE}
                              onValueChange={(val: string) => handleColumnMapChange(colIdx, val)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={IGNORE_VALUE}>忽略</SelectItem>
                                {categoryFields.map((field: CategoryFieldConfig) => (
                                  <SelectItem
                                    key={field.key as string}
                                    value={field.key as string}
                                  >
                                    {field.label}
                                    {isRequired && (
                                      <span className="text-red-500 ml-1">*</span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isMissingRequired && (
                              <p className="text-xs text-amber-600 mt-1">
                                可能是必填字段，建议匹配
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-500 truncate max-w-xs">
                            {sampleValue || <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Data preview rows */}
              {previewRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    数据预览（前 {previewRows.length} 行）
                  </p>
                  <div className="border border-gray-200 rounded-md overflow-hidden overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {headers.map((h: string, idx: number) => (
                            <th
                              key={idx}
                              className="text-left font-medium px-2 py-1.5 text-gray-600 whitespace-nowrap border-r border-gray-100 last:border-r-0"
                            >
                              {h || `列${idx + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row: string[], rowIdx: number) => (
                          <tr key={rowIdx} className="border-t border-gray-100">
                            {headers.map((_h: string, colIdx: number) => (
                              <td
                                key={colIdx}
                                className="px-2 py-1.5 text-gray-600 border-r border-gray-50 last:border-r-0 max-w-[120px] truncate"
                                title={row[colIdx] ?? ''}
                              >
                                {row[colIdx] || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="py-16 text-center">
              <RefreshCw className="w-10 h-10 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-base font-medium text-gray-700">正在导入数据...</p>
              <p className="text-sm text-gray-500 mt-1">
                共 {allRows.length} 条数据，请稍候
              </p>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && importResult && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
                  <p className="text-2xl font-semibold text-gray-700">{importResult.total}</p>
                  <p className="text-sm text-gray-500 mt-1">总计</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
                  <p className="text-2xl font-semibold text-green-600">{importResult.success}</p>
                  <p className="text-sm text-green-600 mt-1">成功</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
                  <p className="text-2xl font-semibold text-red-600">{importResult.failed}</p>
                  <p className="text-sm text-red-600 mt-1">失败</p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    错误详情
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-48 overflow-y-auto">
                    <ul className="space-y-1 text-sm text-red-700">
                      {importResult.errors.map((err: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-400 flex-shrink-0">•</span>
                          <span className="break-words">{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {importResult.failed === 0 && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-md px-3 py-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>全部数据导入成功！</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-gray-100 mt-2">
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
            </>
          )}

          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={handleResetFile}>
                重新选择文件
              </Button>
              <Button onClick={handleImport}>
                开始导入（{allRows.length} 条）
              </Button>
            </>
          )}

          {step === 'importing' && (
            <Button disabled>导入中...</Button>
          )}

          {step === 'result' && (
            <>
              <Button variant="outline" onClick={handleResetFile}>
                继续导入
              </Button>
              <Button onClick={handleClose}>
                完成
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
