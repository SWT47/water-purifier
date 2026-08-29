import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ApiResp,
  Product,
  ProductCategory,
  ProductCreateInput,
  ProductListParams,
  ProductListResult,
  ImportResult,
} from '@shared/api.interface';
import {
  getProductList as getProductListStatic,
  getProduct as getProductStatic,
  compareProducts as compareProductsStatic,
} from './products-static';

const READ_API_PREFIX = '/openapi/products';
const WRITE_API_PREFIX = '/api/products';

function isReadSuccess<T>(resp: ApiResp<T> | unknown): resp is ApiResp<T> {
  return (
    typeof resp === 'object' &&
    resp !== null &&
    'success' in resp &&
    (resp as { success: unknown }).success === true
  );
}

export async function getProductList(
  params: ProductListParams,
): Promise<ApiResp<ProductListResult>> {
  try {
    const response = await axiosForBackend.get(READ_API_PREFIX, { params });
    if (response.status !== 200 || !isReadSuccess<ProductListResult>(response.data)) {
      logger.warn(
        `API 返回非成功状态 (${response.status})，使用静态数据 - 获取产品列表`,
      );
      return getProductListStatic(params);
    }
    return response.data;
  } catch (error) {
    logger.warn('API 调用失败，使用静态数据 - 获取产品列表', error);
    return getProductListStatic(params);
  }
}

export async function getProduct(id: string): Promise<ApiResp<Product>> {
  try {
    const response = await axiosForBackend.get(`${READ_API_PREFIX}/${id}`);
    if (response.status !== 200 || !isReadSuccess<Product>(response.data)) {
      logger.warn(
        `API 返回非成功状态 (${response.status})，使用静态数据 - 获取产品详情`,
      );
      return getProductStatic(id);
    }
    return response.data;
  } catch (error) {
    logger.warn('API 调用失败，使用静态数据 - 获取产品详情', error);
    return getProductStatic(id);
  }
}

export async function createProduct(
  data: ProductCreateInput,
): Promise<ApiResp<Product>> {
  try {
    const response = await axiosForBackend.post(WRITE_API_PREFIX, data);
    return response.data;
  } catch (error) {
    logger.error('创建产品失败', error);
    throw error;
  }
}

export async function updateProduct(
  id: string,
  data: Partial<ProductCreateInput>,
): Promise<ApiResp<Product>> {
  try {
    const response = await axiosForBackend.patch(`${WRITE_API_PREFIX}/${id}`, data);
    return response.data;
  } catch (error) {
    logger.error('更新产品失败', error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<ApiResp<null>> {
  try {
    const response = await axiosForBackend.delete(`${WRITE_API_PREFIX}/${id}`);
    return response.data;
  } catch (error) {
    logger.error('删除产品失败', error);
    throw error;
  }
}

export async function compareProducts(
  ids: string[],
): Promise<ApiResp<Product[]>> {
  try {
    const response = await axiosForBackend.get(`${READ_API_PREFIX}/compare`, {
      params: { ids: ids.join(',') },
    });
    if (response.status !== 200 || !isReadSuccess<Product[]>(response.data)) {
      logger.warn(
        `API 返回非成功状态 (${response.status})，使用静态数据 - 对比产品`,
      );
      return compareProductsStatic(ids);
    }
    return response.data;
  } catch (error) {
    logger.warn('API 调用失败，使用静态数据 - 对比产品', error);
    return compareProductsStatic(ids);
  }
}

export async function importProducts(
  category: ProductCategory,
  rows: unknown[],
): Promise<ApiResp<ImportResult>> {
  try {
    const response = await axiosForBackend.post(`${WRITE_API_PREFIX}/import`, {
      category,
      rows,
    });
    return response.data;
  } catch (error) {
    logger.error('导入产品失败', error);
    throw error;
  }
}
