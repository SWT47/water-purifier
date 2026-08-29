import React, { useCallback, useRef, useState } from 'react';
import { X, Video, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploaderProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  accept?: string;
  multiple?: boolean;
  maxCount?: number;
  type: 'image' | 'video';
  label: string;
  description?: string;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  value = [],
  onChange,
  accept,
  multiple = true,
  maxCount = 20,
  type,
  label,
  description,
  disabled,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const defaultAccept = type === 'image'
    ? 'image/jpeg,image/png,image/gif,image/webp,image/jpg'
    : 'video/mp4,video/webm,video/quicktime';

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remaining = maxCount - value.length;
      if (remaining <= 0) {
        toast.warning(`最多上传 ${maxCount} 个文件`);
        return;
      }

      const fileList = Array.from(files).slice(0, remaining);
      const formData = new FormData();
      for (const file of fileList) {
        formData.append('files', file);
      }

      setUploading(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { success: boolean; urls: string[] };
        if (data.success && data.urls) {
          const newUrls = [...value, ...data.urls];
          onChange?.(newUrls);
          toast.success(`上传成功，共 ${data.urls.length} 个文件`);
        } else {
          throw new Error('上传失败');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`上传失败：${msg}`);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [value, onChange, maxCount],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const newUrls = [...value];
      newUrls.splice(index, 1);
      onChange?.(newUrls);
    },
    [value, onChange],
  );

  const canAddMore = value.length < maxCount;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">
          {label}
          <span className="text-xs text-gray-400 ml-2">
            ({value.length}/{maxCount})
          </span>
        </div>
        {uploading && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            上传中...
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-400 mb-2">{description}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {value.map((url: string, index: number) => (
          <div
            key={index}
            className="relative w-20 h-20 rounded-md border border-gray-200 overflow-hidden bg-gray-50 group"
          >
            {type === 'image' ? (
              <img
                src={url}
                alt={`上传图片 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                <Video className="w-6 h-6 text-gray-400" />
                <span className="text-[10px] text-gray-500 mt-1">视频</span>
              </div>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                title="删除"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {canAddMore && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors bg-gray-50/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[11px] mt-1">添加</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept || defaultAccept}
        multiple={multiple}
        className="hidden"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          handleUpload(e.target.files);
        }}
      />
    </div>
  );
};

export default FileUploader;
