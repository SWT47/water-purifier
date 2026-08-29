import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import {
  CATEGORY_FIELDS,
  CATEGORY_LABELS,
  type Product,
  type ProductCategory,
  type CategoryFieldConfig,
  type ProductCreateInput,
} from '@/utils/constants';
import { cn } from '@/utils/cn';

interface ProductFormModalProps {
  open: boolean;
  product: Product | null;
  category: ProductCategory;
  onClose: () => void;
  onSubmit: (data: ProductCreateInput) => Promise<void>;
}

const buildSchema = (fields: CategoryFieldConfig[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    const key = String(field.key);
    switch (field.type) {
      case 'string':
      case 'image':
        shape[key] = z.string().nullable().optional();
        break;
      case 'number':
        shape[key] = z
          .union([z.number(), z.string(), z.null()])
          .optional()
          .transform((v) => {
            if (v === null || v === undefined || v === '') return null;
            return Number(v);
          });
        break;
      case 'boolean':
        shape[key] = z.boolean().optional().default(false);
        break;
      case 'images':
      case 'videos':
        shape[key] = z.array(z.string()).optional().default([]);
        break;
      default:
        shape[key] = z.string().nullable().optional();
    }
  }
  shape.brand = z.string().min(1, '品牌不能为空');
  shape.model = z.string().min(1, '型号不能为空');
  return z.object(shape);
};

const getDefaultValues = (
  fields: CategoryFieldConfig[],
  product: Product | null,
  category: ProductCategory,
): Record<string, unknown> => {
  const defaults: Record<string, unknown> = {};
  for (const field of fields) {
    const key = String(field.key);
    if (product) {
      const val = product[field.key as keyof Product];
      if (field.type === 'images' || field.type === 'videos') {
        defaults[key] = Array.isArray(val) && val.length > 0
          ? (val as string[]).join('\n')
          : '';
      } else if (field.type === 'boolean') {
        defaults[key] = Boolean(val);
      } else if (val === null || val === undefined) {
        defaults[key] = '';
      } else {
        defaults[key] = val;
      }
    } else {
      if (field.type === 'images' || field.type === 'videos') {
        defaults[key] = [];
      } else if (field.type === 'boolean') {
        defaults[key] = false;
      } else if (field.type === 'number') {
        defaults[key] = '';
      } else {
        defaults[key] = '';
      }
    }
  }
  defaults.category = category;
  defaults.isOnSale = product ? product.isOnSale : true;
  return defaults;
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  product,
  category,
  onClose,
  onSubmit,
}) => {
  const fields = CATEGORY_FIELDS[category] || [];
  const schema = useMemo(() => buildSchema(fields), [fields]);
  const defaultValues = useMemo(
    () => getDefaultValues(fields, product, category),
    [fields, product, category],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      const vals = getDefaultValues(fields, product, category);
      reset(vals);
    }
  }, [open, product, category, fields, reset]);

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    const processed: Record<string, unknown> = { ...values };

    for (const field of fields) {
      const key = String(field.key);
      if (field.type === 'image') {
        const val = processed[key];
        processed[key] =
          val === '' || val === null || val === undefined ? null : String(val);
      } else if (field.type === 'images' || field.type === 'videos') {
        const val = processed[key];
        if (Array.isArray(val)) {
          processed[key] = val.filter((v: unknown) => Boolean(v));
        } else if (typeof val === 'string') {
          processed[key] = val
            .split(/[,，\n\r;；]/)
            .map((s: string) => s.trim())
            .filter(Boolean);
        } else {
          processed[key] = [];
        }
      }
    }

    const data: ProductCreateInput = {
      category,
      ...processed,
    } as unknown as ProductCreateInput;

    console.log('[ProductForm] 提交数据:', JSON.stringify({
      whiteBgImage: data.whiteBgImage,
      realImages: (data as any).realImages,
      realVideos: (data as any).realVideos,
    }));

    await onSubmit(data);
  };

  const isEdit = !!product;
  const categoryLabel = CATEGORY_LABELS[category];

  const renderField = (field: CategoryFieldConfig) => {
    const key = String(field.key);
    const isRequired = key === 'brand' || key === 'model';
    const error = errors[key];

    if (field.type === 'boolean') {
      const value = watch(key) as boolean;
      return (
        <div key={key} className="flex-1 min-w-[200px]">
          <Label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}
          </Label>
          <div className="flex items-center h-9 gap-2">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(checked: boolean) => setValue(key, checked)}
            />
            <span className="text-sm text-gray-600">
              {value ? '是' : '否'}
            </span>
          </div>
        </div>
      );
    }

    if (field.type === 'image') {
      return (
        <div key={key} className="flex-1 min-w-[280px] w-full">
          <Label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}
            {isRequired && (
              <span className="text-red-500 ml-0.5">*</span>
            )}
          </Label>
          <Input
            {...register(key)}
            placeholder={`请输入${field.label}URL`}
            className={cn('h-9 text-sm', error && 'border-red-500')}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            请输入图片的完整 URL 地址（https://...）
          </p>
        </div>
      );
    }

    if (field.type === 'images') {
      const val = watch(key);
      const displayVal = Array.isArray(val) ? val.join('\n') : (val ?? '');
      return (
        <div key={key} className="flex-1 min-w-[280px] w-full">
          <Label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}
            {isRequired && (
              <span className="text-red-500 ml-0.5">*</span>
            )}
          </Label>
          <textarea
            {...register(key)}
            placeholder={`每行一个图片URL，或用逗号分隔\nhttps://xxx.com/1.jpg\nhttps://xxx.com/2.jpg`}
            className="w-full min-h-[90px] px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-y"
            value={displayVal as string}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setValue(key, e.target.value);
            }}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            每行一个 URL，或用逗号/分号分隔
          </p>
        </div>
      );
    }

    if (field.type === 'videos') {
      const val = watch(key);
      const displayVal = Array.isArray(val) ? val.join('\n') : (val ?? '');
      return (
        <div key={key} className="flex-1 min-w-[280px] w-full">
          <Label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}
            {isRequired && (
              <span className="text-red-500 ml-0.5">*</span>
            )}
          </Label>
          <textarea
            {...register(key)}
            placeholder={`每行一个视频URL，或用逗号分隔\nhttps://xxx.com/1.mp4`}
            className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-y"
            value={displayVal as string}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setValue(key, e.target.value);
            }}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            每行一个 URL，或用逗号/分号分隔
          </p>
        </div>
      );
    }

    const inputType = field.type === 'number' ? 'number' : 'text';

    return (
      <div key={key} className="flex-1 min-w-[200px]">
        <Label className="mb-1.5 block text-sm font-medium text-gray-700">
          {field.label}
          {isRequired && (
            <span className="text-red-500 ml-0.5">*</span>
          )}
        </Label>
        <Input
          type={inputType}
          {...register(key)}
          placeholder={`请输入${field.label}`}
          className={cn(error && 'border-red-500')}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">
            {String(error.message || '校验错误')}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? '编辑产品' : `新增${categoryLabel}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <div className="flex flex-wrap gap-4">
              {fields.map((field: CategoryFieldConfig) => renderField(field))}
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="black"
            onClick={handleSubmit(handleFormSubmit)}
          >
            {isEdit ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
