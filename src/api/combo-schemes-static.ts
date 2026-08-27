import type { ComboScheme } from '@/types';

interface StaticApiResp<T> {
  success: boolean;
  data: T;
  message: string;
}

const comboSchemes: ComboScheme[] = [];

export async function listComboSchemes(): Promise<StaticApiResp<ComboScheme[]>> {
  return { success: true, data: comboSchemes, message: '静态数据' };
}
