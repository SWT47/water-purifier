import type { ComboScheme } from '@/types';
import { listComboSchemes as listComboSchemesStatic } from './combo-schemes-static';

const API_BASE = '/api/combo-schemes';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let message = `请求失败 (${response.status})`;
    try {
      const data = JSON.parse(text);
      message = data.message || data.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
      if (!data.success) {
        throw new Error(data.message || '操作失败');
      }
      return data.data as T;
    }
    return data as T;
  }
  return undefined as unknown as T;
}

export async function listComboSchemes(): Promise<ComboScheme[]> {
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await handleResponse<ComboScheme[]>(response);
  } catch (err) {
    console.warn('[combo-schemes] listComboSchemes 接口失败，降级到静态数据:', err);
    const result = await listComboSchemesStatic();
    return result.data;
  }
}

export async function createComboScheme(data: {
  name: string;
  productIds: string[];
  livePrice?: number;
}): Promise<ComboScheme> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ComboScheme>(response);
}

export async function updateComboScheme(
  id: string,
  data: Partial<{ name: string; productIds: string[]; livePrice: number | null }>,
): Promise<ComboScheme> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ComboScheme>(response);
}

export async function deleteComboScheme(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  await handleResponse<void>(response);
}
