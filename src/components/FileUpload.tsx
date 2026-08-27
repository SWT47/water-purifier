import React, { useRef, useState } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

/* ---------------- ImageUpload (single) ---------------- */

export interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  placeholder = '点击上传图片',
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result));
      toast.success('图片加载成功');
    };
    reader.onerror = () => {
      toast.error('读取图片失败');
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div
      onClick={handlePick}
      className={cn(
        'group relative inline-flex w-28 h-28 rounded-md border border-dashed cursor-pointer overflow-hidden transition-colors',
        value ? 'border-gray-200' : 'border-gray-300 hover:border-gray-400',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      {value ? (
        <>
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="删除图片"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
          <Upload className="w-6 h-6 mb-1" />
          <span className="text-xs">{placeholder}</span>
        </div>
      )}
    </div>
  );
};

/* ---------------- MultiImageUpload ---------------- */

export interface MultiImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxCount?: number;
  className?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 9,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = Array.isArray(value) ? value : [];
  const canAdd = urls.length < maxCount;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const imageFiles = files.filter((f: File) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('请选择图片文件');
      return;
    }
    const remaining = maxCount - urls.length;
    const toRead = imageFiles.slice(0, remaining);

    const results: string[] = [];
    let loaded = 0;

    toRead.forEach((file: File, idx: number) => {
      const reader = new FileReader();
      reader.onload = () => {
        results[idx] = String(reader.result);
        loaded += 1;
        if (loaded === toRead.length) {
          onChange([...urls, ...results]);
          toast.success(`成功添加 ${results.length} 张图片`);
        }
      };
      reader.onerror = () => {
        loaded += 1;
        toast.error(`${file.name} 读取失败`);
        if (loaded === toRead.length && results.length > 0) {
          onChange([...urls, ...results]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (inputRef.current) inputRef.current.value = '';
  };

  const handlePick = () => {
    if (!canAdd) return;
    inputRef.current?.click();
  };

  const handleRemove = (index: number) => {
    const next = urls.filter((_: string, i: number) => i !== index);
    onChange(next);
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {urls.map((url: string, index: number) => (
          <div
            key={`${url.substring(0, 20)}-${index}`}
            className="group relative aspect-square rounded-md overflow-hidden border border-gray-200 shadow-sm"
          >
            <img
              src={url}
              alt={`image-${index}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="删除图片"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            onClick={handlePick}
            className="aspect-square rounded-md border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-xs">添加图片</span>
          </button>
        )}
      </div>
    </div>
  );
};

/* ---------------- VideoUpload ---------------- */

export interface VideoUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxCount?: number;
  className?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  value = [],
  onChange,
  maxCount = 5,
  className,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = Array.isArray(value) ? value : [];
  const canAdd = urls.length < maxCount;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const videoFiles = Array.from(files).filter((f: File) => f.type.startsWith('video/'));
    if (videoFiles.length === 0) {
      toast.error('请选择视频文件');
      return;
    }
    const remaining = maxCount - urls.length;
    const toAdd = videoFiles.slice(0, remaining);
    const newUrls = toAdd.map((f: File) => URL.createObjectURL(f));
    onChange([...urls, ...newUrls]);
    toast.success(`成功添加 ${newUrls.length} 个视频`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (index: number) => {
    const next = urls.filter((_: string, i: number) => i !== index);
    onChange(next);
  };

  return (
    <div
      className={cn('w-full', className)}
      onDragOver={(e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <div className="space-y-2">
        {urls.map((url: string, index: number) => (
          <div
            key={`${url.substring(0, 20)}-${index}`}
            className="flex items-center gap-3 p-2 rounded-md border border-gray-200 bg-gray-50"
          >
            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-gray-500">视频 {index + 1}</span>
            </div>
            <span className="flex-1 text-sm text-gray-700 truncate">
              视频 {index + 1}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {canAdd && (
          <div
            onClick={() => inputRef.current?.click()}
            className={cn(
              'border border-dashed rounded-md p-4 text-center cursor-pointer transition-colors',
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
            )}
          >
            <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
            <span className="text-xs text-gray-500">
              点击或拖拽上传视频（最多 {maxCount} 个）
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
