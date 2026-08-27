import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type {
  CategoryFieldConfig,
  ProductCategory,
  ProductCreateInput,
} from '@/utils/constants';
import { CATEGORY_FIELDS } from '@/utils/constants';
import {
  CATEGORY_EXCEL_COLUMN_MAP,
  CATEGORY_LABELS,
} from '@/utils/constants';
import { importProducts } from '@/api/products';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

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

const ImportModal: React.FC<ImportModalProps> = ({
  open,
  onOpenChange,
  defaultCategory,
  onSuccess,
}) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [category, setCategory] = useState<ProductCategory>(defaultCategory);
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [importCount, setImportCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryFields: CategoryFieldConfig[] = useMemo(
    () => CATEGORY_FIELDS[category] ?? [],
    [category],
  );

  const matchedFieldKeys = useMemo(() => {
    return new Set(
      Object.values(columnMapping).filter((v: string) => v !== IGNORE_VALUE),
    );
  }, [columnMapping]);

  const requiredFields = useMemo(() => {
    return categoryFields.filter((f: CategoryFieldConfig) => {
      const key = f.key as string;
      return key === 'brand' || key === 'model';
    });
  }, [categoryFields]);

  const missingRequiredFields = useMemo(() => {
    return requiredFields.filter(
      (f: CategoryFieldConfig) => !matchedFieldKeys.has(f.key as string),
    );
  }, [requiredFields, matchedFieldKeys]);

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setStep('upload');
      setFileName('');
      setHeaders([]);
      setPreviewRows([]);
      setAllRows([]);
      setColumnMapping({});
      setImportCount(0);
    }
  }, [open, defaultCategory]);

  useEffect(() => {
    if (headers.length === 0) return;
    const mapping = autoMatchColumns(headers, category);
    setColumnMapping(mapping);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, headers]);

  const autoMatchColumns = useCallback(
    (headerList: string[], cat: ProductCategory): Record<number, string> => {
      const colMap: Record<string, string> = CATEGORY_EXCEL_COLUMN_MAP[cat] ?? {};
      const mapping: Record<number, string> = {};
      const usedKeys = new Set<string>();

      headerList.forEach((header: string, idx: number) => {
        const trimmed = header.trim();
        if (colMap[trimmed] && !usedKeys.has(colMap[trimmed])) {
          mapping[idx] = colMap[trimmed];
          usedKeys.add(colMap[trimmed]);
          return;
        }
        const normalized = trimmed.replace(/\s+/g, '').toLowerCase();
        for (const [cnName, fieldKey] of Object.entries(colMap)) {
          if (usedKeys.has(fieldKey)) continue;
          const cnNorm = cnName.replace(/\s+/g, '').toLowerCase();
          if (
            normalized === cnNorm ||
            normalized.includes(cnNorm) ||
            cnNorm.includes(normalized)
          ) {
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

  const parseFile = useCallback(
    (file: File) => {
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
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false,
          }) as unknown[][];

          if (jsonData.length === 0) {
            toast.error('Excel 文件为空');
            return;
          }

          const headerRow = (jsonData[0] ?? []).map((v: unknown) =>
            String(v ?? '').trim(),
          );
          const dataRows = jsonData.slice(1).filter((row: unknown[]) => {
            return row.some((cell: unknown) => String(cell ?? '').trim());
          }).map((row: unknown[]) => row.map((c: unknown) => String(c ?? '')));

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
          console.error('解析 Excel 文件失败', error);
          toast.error('解析 Excel 文件失败，请检查文件格式');
        }
      };
      reader.onerror = () => {
        toast.error('读取文件失败');
      };
      reader.readAsBinaryString(file);
    },
    [category, autoMatchColumns],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
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
    setImportCount(0);
  }, []);

  const buildProductRow = useCallback(
    (row: string[]): ProductCreateInput => {
      const product: Partial<ProductCreateInput> = { category };

      for (let colIdx = 0; colIdx < headers.length; colIdx += 1) {
        const fieldKey = columnMapping[colIdx];
        if (!fieldKey || fieldKey === IGNORE_VALUE) continue;

        const fieldConfig = categoryFields.find(
          (f: CategoryFieldConfig) => String(f.key) === fieldKey,
        );
        const rawValue = row[colIdx] ?? '';
        const prodRec = product as Record<string, unknown>;

        if (!fieldConfig) {
          prodRec[fieldKey] = rawValue;
          continue;
        }

        switch (fieldConfig.type) {
          case 'boolean':
            prodRec[fieldKey] = parseBoolean(rawValue);
            break;
          case 'number':
            prodRec[fieldKey] = parseNumber(rawValue);
            break;
          case 'images':
          case 'videos':
            prodRec[fieldKey] = parseArray(rawValue);
            break;
          case 'image':
          case 'string':
          default:
            prodRec[fieldKey] = String(rawValue || '') || null;
            break;
        }
      }

      return product as ProductCreateInput;
    },
    [category, headers, columnMapping, categoryFields],
  );

  const handleStartImport = useCallback(async () => {
    if (allRows.length === 0) {
      toast.error('没有可导入的数据');
      return;
    }
    if (missingRequiredFields.length > 0) {
      toast.error(
        `缺少必填字段：${missingRequiredFields
          .map((f: CategoryFieldConfig) => f.label)
          .join('、')}`,
      );
      return;
    }

    setStep('importing');
    try {
      const rows = allRows.map((row: string[]) => buildProductRow(row));
      const result = await importProducts(category, rows);
      setImportCount(result.count ?? result.success ?? rows.length);
      setStep('result');
      onSuccess();
      toast.success(`导入完成，成功 ${result.count ?? rows.length} 条`);
    } catch (error) {
      console.error('导入失败', error);
      toast.error('导入失败，请稍后重试');
      setStep('mapping');
    }
  }, [allRows, category, buildProductRow, missingRequiredFields, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[90vw] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">Excel 导入</DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">选择类目：</span>
                <div className="w-48">
                  <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类目" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  点击或拖拽上传 Excel 文件
                </p>
                <p className="text-xs text-gray-500">支持 .xlsx 和 .xls 格式</p>
              </div>

              <div className="bg-gray-50 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    导入说明
                  </span>
                </div>
                <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                  <li>Excel 第一行为表头，系统将自动匹配字段</li>
                  <li>品牌、型号为必填字段</li>
                  <li>是/否类型字段可填写：是/否、true/false、1/0</li>
                  <li>多图/多视频字段用逗号分隔多个 URL</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>文件：</span>
                  <span className="font-medium text-gray-900">{fileName}</span>
                  <span className="text-gray-400">
                    （{allRows.length} 条数据）
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFile}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  重新选择
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">类目：</span>
                <div className="w-48">
                  <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                  字段映射（{headers.length} 列）
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {headers.map((header: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="w-32 text-sm text-gray-600 truncate">
                        {header || `第${idx + 1}列`}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <Select
                          value={columnMapping[idx] || IGNORE_VALUE}
                          onValueChange={(v: string) =>
                            handleColumnMapChange(idx, v)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={IGNORE_VALUE}>
                              不导入该列
                            </SelectItem>
                            {categoryFields.map((f: CategoryFieldConfig) => (
                              <SelectItem
                                key={f.key as string}
                                value={f.key as string}
                              >
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {columnMapping[idx] &&
                      columnMapping[idx] !== IGNORE_VALUE ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {missingRequiredFields.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                  <span className="font-medium">缺少必填字段：</span>
                  {missingRequiredFields
                    .map((f: CategoryFieldConfig) => f.label)
                    .join('、')}
                </div>
              )}

              <div className="border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                  数据预览（前 5 行）
                </div>
                <div className="max-h-[200px] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        {headers.map((h: string, i: number) => (
                          <th
                            key={i}
                            className="px-2 py-1.5 text-left font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
                          >
                            {h || `列${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row: string[], ri: number) => (
                        <tr key={ri} className="border-t border-gray-100">
                          {row.map((cell: string, ci: number) => (
                            <td
                              key={ci}
                              className="px-2 py-1 text-gray-700 border-r border-gray-100 last:border-r-0 truncate max-w-[200px]"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">正在导入，请稍候...</p>
            </div>
          )}

          {step === 'result' && (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-semibold text-gray-900 mb-1">导入完成</p>
              <p className="text-sm text-gray-500">
                共导入 {importCount} 条数据
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
          )}
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={handleResetFile}>
                上一步
              </Button>
              <Button
                variant="black"
                onClick={handleStartImport}
                disabled={allRows.length === 0 || missingRequiredFields.length > 0}
              >
                开始导入
              </Button>
            </>
          )}
          {step === 'importing' && null}
          {step === 'result' && (
            <Button variant="black" onClick={() => onOpenChange(false)}>
              完成
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;
