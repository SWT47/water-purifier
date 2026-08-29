import React, { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import {
  Upload,
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Plus,
  Loader2,
  Play,
  Trash2,
} from 'lucide-react';
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { getDefaultBucketId } from '@lark-apaas/client-toolkit/tools/storage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Image from '@/components/ui/image';

/* -------------------------------------------------------------------------- */
/* uploadFile utility                                                         */
/* -------------------------------------------------------------------------- */

async function uploadFile(file: File): Promise<string> {
  const dataloom = await getDataloom();
  const { data, error } = await dataloom
    .storage
    .from(getDefaultBucketId())
    .uploadFile(file);
  if (error || !data) {
    const err = error as { message?: string; error_msg?: string };
    const msg = err.message || err.error_msg || '未知错误';
    throw new Error(msg);
  }
  return data.download_url;
}

/* -------------------------------------------------------------------------- */
/* ImageUpload - 单图上传                                                     */
/* -------------------------------------------------------------------------- */

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
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
      toast.success('图片上传成功');
    } catch (err) {
      logger.error(`图片上传失败: ${String(err)}`);
      toast.error(`上传失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) handleFile(acceptedFiles[0]);
    },
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative inline-flex w-28 h-28 rounded-md border border-dashed transition-colors cursor-pointer overflow-hidden',
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400',
        className,
      )}
      onClick={handlePick}
    >
      <input
        ref={inputRef}
        {...getInputProps()}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {value ? (
        <>
          <Image
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="删除图片"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : uploading ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mb-1" />
          <span className="text-xs">上传中...</span>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
          <Upload className="w-6 h-6 mb-1" />
          <span className="text-xs">{placeholder}</span>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MultiImageUpload - 多图上传                                                */
/* -------------------------------------------------------------------------- */

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
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = Array.isArray(value) ? value : [];
  const canAdd = urls.length < maxCount;

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter((f: File) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('请选择图片文件');
      return;
    }
    const remaining = maxCount - urls.length;
    const toUpload = imageFiles.slice(0, remaining);
    if (imageFiles.length > remaining) {
      toast.warning(`最多上传 ${maxCount} 张，已自动截取`);
    }

    setUploading(true);
    try {
      const results: string[] = [];
      for (const f of toUpload) {
        try {
          const url = await uploadFile(f);
          results.push(url);
        } catch (err) {
          logger.error(`图片上传失败 ${f.name}: ${String(err)}`);
          toast.error(`${f.name} 上传失败`);
        }
      }
      const next = [...urls, ...results];
      onChange(next);
      if (results.length > 0) toast.success(`成功上传 ${results.length} 张图片`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) handleFiles(files);
  };

  const handlePick = () => {
    if (uploading || !canAdd) return;
    inputRef.current?.click();
  };

  const handleRemove = (index: number) => {
    const next = urls.filter((_: string, i: number) => i !== index);
    onChange(next);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: true,
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) handleFiles(acceptedFiles);
    },
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn('w-full', className)}
    >
      <input
        ref={inputRef}
        {...getInputProps()}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <div
        className={cn(
          'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3',
          isDragActive && 'ring-2 ring-blue-500 ring-offset-2 rounded-md p-1',
        )}
      >
        {urls.map((url: string, index: number) => (
          <div
            key={`${url}-${index}`}
            className="group relative aspect-square rounded-md overflow-hidden border border-gray-200 shadow-sm"
          >
            <Image
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
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading}
            className={cn(
              'aspect-square rounded-md border border-dashed flex flex-col items-center justify-center text-gray-400 transition-colors',
              uploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400 hover:text-gray-600 cursor-pointer',
            )}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-xs">添加图片</span>
              </>
            )}
          </button>
        )}
      </div>
      {urls.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          已上传 {urls.length} / {maxCount}
        </p>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* VideoUpload - 多视频上传                                                   */
/* -------------------------------------------------------------------------- */

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
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = Array.isArray(value) ? value : [];
  const canAdd = urls.length < maxCount;

  const handleFiles = async (files: File[]) => {
    const videoFiles = files.filter((f: File) => f.type.startsWith('video/'));
    if (videoFiles.length === 0) {
      toast.error('请选择视频文件');
      return;
    }
    const remaining = maxCount - urls.length;
    const toUpload = videoFiles.slice(0, remaining);
    if (videoFiles.length > remaining) {
      toast.warning(`最多上传 ${maxCount} 个视频，已自动截取`);
    }

    setUploading(true);
    try {
      const results: string[] = [];
      for (const f of toUpload) {
        try {
          const url = await uploadFile(f);
          results.push(url);
        } catch (err) {
          logger.error(`视频上传失败 ${f.name}: ${String(err)}`);
          toast.error(`${f.name} 上传失败`);
        }
      }
      const next = [...urls, ...results];
      onChange(next);
      if (results.length > 0) toast.success(`成功上传 ${results.length} 个视频`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) handleFiles(files);
  };

  const handlePick = useCallback(() => {
    if (uploading || !canAdd) return;
    inputRef.current?.click();
  }, [uploading, canAdd]);

  const handleRemove = (index: number) => {
    const next = urls.filter((_: string, i: number) => i !== index);
    onChange(next);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'video/*': [] },
    multiple: true,
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) handleFiles(acceptedFiles);
    },
    noClick: true,
    noKeyboard: true,
  });

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  return (
    <div {...getRootProps()} className={cn('w-full', className)}>
      <input
        ref={inputRef}
        {...getInputProps()}
        type="file"
        accept="video/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <div
        className={cn(
          'space-y-2',
          isDragActive && 'ring-2 ring-blue-500 ring-offset-2 rounded-md p-1',
        )}
      >
        {urls.map((url: string, index: number) => (
          <div
            key={`${url}-${index}`}
            className="group flex items-center gap-3 p-3 rounded-md border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
              <VideoIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                视频 {index + 1}
              </p>
              <p className="text-xs text-gray-500 truncate">{url}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePreview(url)}
                className="h-8 px-2"
              >
                <Play className="w-4 h-4" />
                预览
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading}
            className={cn(
              'w-full flex items-center justify-center gap-2 p-4 rounded-md border border-dashed transition-colors',
              uploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed text-gray-400'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 cursor-pointer',
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">上传中...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-sm">点击或拖拽上传视频</span>
              </>
            )}
          </button>
        )}
      </div>
      {urls.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          已上传 {urls.length} / {maxCount}
        </p>
      )}

      {/* 视频预览弹窗 */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-3xl bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePreview}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              aria-label="关闭预览"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              src={previewUrl}
              controls
              autoPlay
              className="w-full max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  ImageUpload,
  MultiImageUpload,
  VideoUpload,
  uploadFile,
};
