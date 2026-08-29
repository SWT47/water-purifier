import React from 'react';
import {
  Table,
  type TableProps,
} from '@lark-apaas/client-toolkit/antd-table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@client/src/components/ui/badge';
import Image from '@client/src/components/ui/image';
import {
  CATEGORY_FIELDS,
  type ProductCategory,
  type CategoryFieldConfig,
  type Product,
} from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

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

const PRICE_KEYS = new Set([
  'dailyPrice',
  'referencePrice',
  'filterTotalCost',
]);

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
          <Image
            src={String(value)}
            alt={field.label}
            width={32}
            height={32}
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
      <Badge variant="default" className="bg-black text-white">
        是
      </Badge>
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

  const columns: TableProps<Product>['columns'] = fields
    .filter(
      (f: CategoryFieldConfig) =>
        f.type !== 'videos' && f.key !== 'isOnSale',
    )
    .map((field: CategoryFieldConfig) => ({
      title: field.label,
      dataIndex: field.key,
      key: field.key,
      width:
        field.type === 'image'
          ? 70
          : field.type === 'boolean'
            ? 90
            : field.type === 'images'
              ? 90
              : 140,
      ellipsis: true,
      render: (_: unknown, record: Product) =>
        renderCell(field, record[field.key]),
    }));

  // 操作列
  columns.push({
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 160,
    render: (_: unknown, record: Product) => (
      <div className="flex items-center gap-1">
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onView(record);
          }}
          className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
          title="查看详情"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onEdit(record);
          }}
          className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
          title="编辑"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete(record);
          }}
          className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  });

  return (
    <div className="flex-1 p-4 overflow-hidden">
      <style>{`
        .product-table .ant-table-thead > tr > th {
          background-color: #000000 !important;
          color: #ffffff !important;
          font-weight: 500 !important;
          font-size: 13px !important;
          border-bottom: none !important;
        }
        .product-table .ant-table-thead > tr > th .ant-table-column-title {
          color: #ffffff !important;
        }
        .product-table .ant-table-tbody > tr.ant-table-row-selected > td {
          background-color: #EFF6FF !important;
          color: #111827 !important;
        }
        .product-table .ant-table-tbody > tr.ant-table-row-selected > td:first-child {
          box-shadow: inset 3px 0 0 0 #06B6D4;
        }
        .product-table .ant-table-tbody > tr.ant-table-row-selected:hover > td {
          background-color: #DBEAFE !important;
        }
        .product-table .ant-table-tbody > tr:hover > td {
          background-color: #f9fafb !important;
          cursor: pointer;
        }
         .product-table .ant-table-fixed-right .ant-table-cell {
          background-color: #ffffff !important;
          border-left: 1px solid #f3f4f6 !important;
          box-shadow: -4px 0 8px -6px rgba(0, 0, 0, 0.08);
        }
        .product-table .ant-table-fixed-right .ant-table-thead > tr > th {
          background-color: #000000 !important;
          border-left: 1px solid #374151 !important;
        }
        .product-table .ant-table-tbody > tr.ant-table-row-selected.ant-table-row > td.ant-table-cell-fix-right {
          background-color: #EFF6FF !important;
        }
        .product-table .ant-table-tbody > tr.ant-table-row-selected:hover > td.ant-table-cell-fix-right {
          background-color: #DBEAFE !important;
        }
        .product-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right {
          background-color: #f9fafb !important;
        }
      `}</style>
      <Table
        className="product-table"
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        scroll={{ x: Math.max(fields.length * 130, 800), y: 500 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[]) => {
            onSelectionChange(keys.map((k: React.Key) => String(k)));
          },
          columnWidth: 48,
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t: number) => `共 ${t} 条`,
          onChange: (p: number, ps: number) => {
            logger.info('page change', p, ps);
            onPageChange(p, ps);
          },
        }}
        onRow={(record: Product) => ({
          onClick: () => onView(record),
        })}
      />
    </div>
  );
};

export default ProductTable;
