export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '价格待定';
  }
  return `¥${value.toLocaleString()}`;
}

export function productTitle(p: { name: string | null; model: string | null }): string {
  if (p.name && p.model) return `${p.name} ${p.model}`;
  return p.name || p.model || '产品名称';
}
