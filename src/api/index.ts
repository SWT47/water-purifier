import type { Product, ProductListQuery, ProductListResponse, ComboScheme } from '@/types'

const BASE_URL = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  const json = await res.json()
  if (json && typeof json === 'object' && 'success' in json) {
    if (!json.success) {
      throw new Error(json.message || '请求失败')
    }
    return json.data as T
  }
  return json as T
}

function buildQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value))
    }
  })
  const str = search.toString()
  return str ? `?${str}` : ''
}

export async function getProducts(query: ProductListQuery): Promise<ProductListResponse> {
  const qs = buildQueryString(query as Record<string, unknown>)
  return request<ProductListResponse>(`/products${qs}`)
}

export async function getProduct(id: string): Promise<Product> {
  return request<Product>(`/products/${id}`)
}

export async function getBrands(): Promise<string[]> {
  return request<string[]>('/products/brands')
}

export async function getComboSchemes(): Promise<ComboScheme[]> {
  return request<ComboScheme[]>('/combo-schemes')
}
