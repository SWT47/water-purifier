// 统一响应格式工具
import type { Response } from 'express';

export function success<T>(res: Response, data: T, message = 'ok'): void {
  res.json({
    success: true,
    data,
    message,
  });
}

export function fail(res: Response, message: string, status = 400): void {
  res.status(status).json({
    success: false,
    data: null,
    message,
  });
}

export function serverError(res: Response, error: unknown): void {
  const msg = error instanceof Error ? error.message : '服务器内部错误';
  res.status(500).json({
    success: false,
    data: null,
    message: msg,
  });
}
