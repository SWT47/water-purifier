import type { ApiResp, ComboScheme } from '@shared/api.interface';

const comboSchemes: ComboScheme[] = [];

export async function listComboSchemes(): Promise<ApiResp<ComboScheme[]>> {
  return { success: true, data: comboSchemes, message: '静态数据' };
}
