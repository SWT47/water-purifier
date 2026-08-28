import type {
  Product,
  ProductListParams,
  ProductListResult,
  ProductCreateInput,
  ImportResult,
} from '@/types';
import {
  getProductList as getProductListStatic,
  getProduct as getProductStatic,
  compareProducts as compareProductsStatic,
} from './products-static';

const API_BASE = '/api/products';

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
  if (!contentType || !contentType.includes('application/json')) {
    // 非 JSON 响应（如被重定向到登录页返回 HTML），视为失败触发 fallback
    throw new Error(`非 JSON 响应 (${response.status})`);
  }
  const data = await response.json();
  // Support both { success, data } wrapper and direct data
  if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
    if (!data.success) {
      throw new Error(data.message || '操作失败');
    }
    return data.data as T;
  }
  return data as T;
}

function buildQueryString(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    usp.append(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export async function getProductList(
  params: ProductListParams,
): Promise<ProductListResult> {
  try {
    const qs = buildQueryString(params as Record<string, unknown>);
    const response = await fetch(`${API_BASE}${qs}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await handleResponse<ProductListResult>(response);
  } catch (err) {
    console.warn('[products] getProductList 接口失败，降级到静态数据:', err);
    const result = await getProductListStatic(params);
    return result.data;
  }
}

export async function getProduct(id: string): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await handleResponse<Product>(response);
  } catch (err) {
    console.warn('[products] getProduct 接口失败，降级到静态数据:', err);
    const result = await getProductStatic(id);
    return result.data;
  }
}

export async function createProduct(
  data: ProductCreateInput,
): Promise<Product> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Product>(response);
}

export async function updateProduct(
  id: string,
  data: Partial<ProductCreateInput>,
): Promise<Product> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Product>(response);
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  await handleResponse<void>(response);
}

export async function compareProducts(ids: string[]): Promise<Product[]> {
  try {
    const qs = ids.length > 0 ? `?ids=${ids.join(',')}` : '';
    const response = await fetch(`${API_BASE}/compare${qs}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await handleResponse<Product[]>(response);
  } catch (err) {
    console.warn('[products] compareProducts 接口失败，降级到静态数据:', err);
    const result = await compareProductsStatic(ids);
    return result.data;
  }
}

export async function importProducts(
  category: string,
  rows: unknown[],
): Promise<ImportResult> {
  const response = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, rows }),
  });
  return handleResponse<ImportResult>(response);
}
