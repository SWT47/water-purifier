import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@client/src/components/ui/form';
import { Input } from '@client/src/components/ui/input';
import { Switch } from '@client/src/components/ui/switch';
import {
  ImageUpload,
  MultiImageUpload,
  VideoUpload,
} from '@client/src/components/FileUpload';
import {
  CATEGORY_FIELDS,
  CATEGORY_LABELS,
  type Product,
  type ProductCategory,
  type CategoryFieldConfig,
  type ProductCreateInput,
} from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

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
  // brand 和 model 必填
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
      const val = product[field.key];
      if (field.type === 'images' || field.type === 'videos') {
        defaults[key] = Array.isArray(val) ? val : [];
      } else if (field.type === 'boolean') {
        defaults[key] = Boolean(val);
      } else if (field.type === 'image') {
        defaults[key] = val || '';
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
  const schema = React.useMemo(() => buildSchema(fields), [fields]);
  const defaultValues = React.useMemo(
    () => getDefaultValues(fields, product, category),
    [fields, product, category],
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      const vals = getDefaultValues(fields, product, category);
      form.reset(vals);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, category]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const cleaned: Record<string, unknown> = { ...values };
      for (const field of fields) {
        const key = String(field.key);
        if (field.type === 'image') {
          cleaned[key] = cleaned[key] || null;
        }
        if (field.type === 'images' || field.type === 'videos') {
          const arr = cleaned[key];
          cleaned[key] = Array.isArray(arr) ? arr : [];
        }
      }
      const data: ProductCreateInput = {
        category,
        ...cleaned,
      } as unknown as ProductCreateInput;
      await onSubmit(data);
    } catch (error) {
      logger.error('提交产品失败', error);
    }
  };

  const isEdit = !!product;
  const categoryLabel = CATEGORY_LABELS[category];

  const renderField = (field: CategoryFieldConfig) => {
    const key = String(field.key);
    const isRequired = key === 'brand' || key === 'model';

    if (field.type === 'boolean') {
      return (
        <FormField
          key={key}
          control={form.control}
          name={key}
          render={({ field: formField }) => (
            <FormItem className="flex-1 min-w-[200px]">
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <div className="flex items-center h-9">
                  <Switch
                    checked={Boolean(formField.value)}
                    onCheckedChange={formField.onChange}
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {formField.value ? '是' : '否'}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    if (field.type === 'image') {
      return (
        <FormField
          key={key}
          control={form.control}
          name={key}
          render={({ field: formField }) => (
            <FormItem className="flex-1 min-w-[200px]">
              <FormLabel>
                {field.label}
                {isRequired && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </FormLabel>
              <FormControl>
                <ImageUpload
                  value={String(formField.value || '')}
                  onChange={(url: string) => formField.onChange(url)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    if (field.type === 'images') {
      return (
        <FormField
          key={key}
          control={form.control}
          name={key}
          render={({ field: formField }) => (
            <FormItem className="flex-1 min-w-[280px] w-full">
              <FormLabel>
                {field.label}
                {isRequired && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </FormLabel>
              <FormControl>
                <MultiImageUpload
                  value={Array.isArray(formField.value) ? formField.value : []}
                  onChange={(urls: string[]) => formField.onChange(urls)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    if (field.type === 'videos') {
      return (
        <FormField
          key={key}
          control={form.control}
          name={key}
          render={({ field: formField }) => (
            <FormItem className="flex-1 min-w-[280px] w-full">
              <FormLabel>
                {field.label}
                {isRequired && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </FormLabel>
              <FormControl>
                <VideoUpload
                  value={Array.isArray(formField.value) ? formField.value : []}
                  onChange={(urls: string[]) => formField.onChange(urls)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    const inputType =
      field.type === 'number' ? 'number' : 'text';

    return (
      <FormField
        key={key}
        control={form.control}
        name={key}
        render={({ field: formField }) => (
          <FormItem className="flex-1 min-w-[200px]">
              <FormLabel>
                {field.label}
                {isRequired && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </FormLabel>
            <FormControl>
              <Input
                type={inputType}
                value={String(formField.value ?? '')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  formField.onChange(e.target.value)
                }
                placeholder={
                  field.type === 'image'
                    ? '图片URL'
                    : field.type === 'images'
                      ? '图片URL1, URL2...'
                      : field.type === 'videos'
                        ? '视频URL1, URL2...'
                        : `请输入${field.label}`
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[90vw] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? '编辑产品' : `新增${categoryLabel}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
            >
              <div className="flex flex-wrap gap-4">
                {fields.map((field: CategoryFieldConfig) =>
                  renderField(field),
                )}
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            className="bg-black hover:bg-gray-800"
          >
            {isEdit ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
