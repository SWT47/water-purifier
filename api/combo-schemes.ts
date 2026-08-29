import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  ComboScheme,
  ComboSchemeCreateInput,
  ComboSchemeUpdateInput,
} from '@shared/api.interface';
import { listComboSchemes as listComboSchemesStatic } from './combo-schemes-static';

export async function listComboSchemes(): Promise<{ success: boolean; data: ComboScheme[]; message: string }> {
  try {
    const response = await axiosForBackend({
      url: '/openapi/combo-schemes',
      method: 'GET',
    });
    if (response.status !== 200 || response.data?.success !== true) {
      logger.warn(
        `API 返回非成功状态 (${response.status})，使用静态数据 - 获取搭配方案列表`,
      );
      return listComboSchemesStatic();
    }
    return response.data;
  } catch (error) {
    logger.warn('API 调用失败，使用静态数据 - 获取搭配方案列表', error);
    return listComboSchemesStatic();
  }
}

export async function createComboScheme(
  input: ComboSchemeCreateInput,
): Promise<{ success: boolean; data: ComboScheme; message: string }> {
  try {
    const response = await axiosForBackend({
      url: '/api/combo-schemes',
      method: 'POST',
      data: input,
    });
    return response.data;
  } catch (error) {
    logger.error('创建搭配方案失败', error);
    throw error;
  }
}

export async function updateComboScheme(
  id: string,
  input: ComboSchemeUpdateInput,
): Promise<{ success: boolean; data: ComboScheme; message: string }> {
  try {
    const response = await axiosForBackend({
      url: `/api/combo-schemes/${id}`,
      method: 'PUT',
      data: input,
    });
    return response.data;
  } catch (error) {
    logger.error('更新搭配方案失败', error);
    throw error;
  }
}

export async function deleteComboScheme(
  id: string,
): Promise<{ success: boolean; data: null; message: string }> {
  try {
    const response = await axiosForBackend({
      url: `/api/combo-schemes/${id}`,
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    logger.error('删除搭配方案失败', error);
    throw error;
  }
}
