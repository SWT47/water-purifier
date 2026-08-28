import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  CATEGORY_FIELDS,
  type ProductCategory,
  type CategoryFieldConfig,
  type Product,
} from '@/utils/constants';
import { PRICE_KEYS } from '@/utils/constants';
import { cn } from '@/utils/cn';

interface ProductTableProps {
  category: ProductCategory;
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  selectedRowKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const renderCell = (
  field: CategoryFieldConfig,
  value: unknown,
): React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400">-</span>;
  }

  if (field.type === 'image') {
    return (
      <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
        {value ? (
          <img
            src={String(value)}
            alt={field.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-xs">无</span>
        )}
      </div>
    );
  }

  if (field.type === 'boolean') {
    return value ? (
      <Badge variant="black">是</Badge>
    ) : (
      <Badge variant="secondary">否</Badge>
    );
  }

  if (field.type === 'images') {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return <span className="text-gray-700">{arr.length}张</span>;
  }

  if (field.type === 'videos') {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return <span className="text-gray-700">{arr.length}个</span>;
  }

  if (PRICE_KEYS.has(String(field.key))) {
    return (
      <span className="font-semibold text-blue-600">
        ¥{Number(value).toLocaleString()}
      </span>
    );
  }

  return <span className="text-gray-800">{String(value)}</span>;
};

const ProductTable: React.FC<ProductTableProps> = ({
  category,
  items,
  total,
  page,
  pageSize,
  loading,
  selectedRowKeys,
  onSelectionChange,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}) => {
  const fields = CATEGORY_FIELDS[category] || [];
  const displayFields = fields.filter(
    (f: CategoryFieldConfig) => f.type !== 'videos',
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(items.map((p: Product) => p.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedRowKeys, id]);
    } else {
      onSelectionChange(selectedRowKeys.filter((k: string) => k !== id));
    }
  };

  const allSelected = items.length > 0 && selectedRowKeys.length === items.length;
  const someSelected = selectedRowKeys.length > 0 && !allSelected;

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex-1 p-4 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
        <table className="w-full border-collapse min-w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-12 px-3 py-2.5 bg-black text-white text-[13px] font-medium text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el: HTMLInputElement | null) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleSelectAll(e.target.checked)
                  }
                  className="w-4 h-4 rounded border-gray-600 accent-blue-600"
                />
              </th>
              {displayFields.map((field: CategoryFieldConfig) => (
                <th
                  key={String(field.key)}
                  className="px-3 py-2.5 bg-black text-white text-[13px] font-medium text-left whitespace-nowrap"
                  style={{
                    width:
                      field.type === 'image'
                        ? 70
                        : field.type === 'boolean'
                          ? 90
                          : field.type === 'images'
                            ? 90
                            : 140,
                  }}
                >
                  {field.label}
                </th>
              ))}
              <th className="px-3 py-2.5 bg-black text-white text-[13px] font-medium text-left sticky right-0 w-[160px]">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={displayFields.length + 2}
                  className="px-3 py-16 text-center text-gray-400 text-sm"
                >
                  加载中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={displayFields.length + 2}
                  className="px-3 py-16 text-center text-gray-400 text-sm"
                >
                  暂无产品
                </td>
              </tr>
            ) : (
              items.map((item: Product) => {
                const isSelected = selectedRowKeys.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    onClick={() => onView(item)}
                    className={cn(
                      'border-b border-gray-100 cursor-pointer transition-all duration-150 group',
                      isSelected
                        ? 'bg-blue-50/60 border-l-4 border-l-blue-500 shadow-sm'
                        : 'hover:bg-gray-50 hover:shadow-sm hover:-translate-y-px',
                    )}
                  >
                    <td
                      className="px-3 py-2.5"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleSelectRow(item.id, e.target.checked)
                        }
                        className="w-4 h-4 rounded accent-blue-600"
                      />
                    </td>
                    {displayFields.map((field: CategoryFieldConfig) => (
                      <td
                        key={String(field.key)}
                        className="px-3 py-2.5 text-sm whitespace-nowrap"
                      >
                         <span
                           className={isSelected ? 'text-blue-700 font-medium' : ''}
                           style={
                             PRICE_KEYS.has(String(field.key)) && !isSelected
                               ? { color: '#2563EB' }
                               : undefined
                           }
                         >
                          {renderCell(field, item[field.key])}
                        </span>
                      </td>
                    ))}
                    <td
                      className="px-3 py-2.5 sticky right-0 bg-inherit"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onView(item)}
                           className={cn(
                             'p-1.5 rounded transition-colors',
                             isSelected
                               ? 'text-blue-600 hover:text-blue-700'
                               : 'text-gray-500 hover:text-blue-600',
                           )}
                           title="查看详情"
                         >
                           <Eye className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => onEdit(item)}
                           className={cn(
                             'p-1.5 rounded transition-colors',
                             isSelected
                               ? 'text-blue-600 hover:text-blue-700'
                               : 'text-gray-500 hover:text-blue-600',
                           )}
                           title="编辑"
                         >
                           <Pencil className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => onDelete(item)}
                           className={cn(
                             'p-1.5 rounded transition-colors',
                             isSelected
                               ? 'text-red-500 hover:text-red-600'
                               : 'text-gray-500 hover:text-red-600',
                           )}
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-3 text-sm text-gray-600">
        <div>
          共 {total} 条，显示 {startItem}-{endItem}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1, pageSize)}
            disabled={page <= 1}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="text-gray-500">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => onPageChange(page + 1, pageSize)}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            下一页
          </button>
          <select
            value={pageSize}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onPageChange(1, Number(e.target.value))
            }
            className="h-8 px-2 rounded border border-gray-300 text-sm bg-white"
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;
