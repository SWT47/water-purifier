import productsData from '@client/src/data/products.json';
import type {
  ApiResp,
  Product,
  ProductListParams,
  ProductListResult,
} from '@shared/api.interface';

const allProducts = productsData as Product[];

export async function getProductList(
  params: ProductListParams,
): Promise<ApiResp<ProductListResult>> {
  const { category, keyword, brand, isOnSale, page = 1, pageSize = 20 } = params;

  let filtered: Product[] = [...allProducts];

  if (category) {
    filtered = filtered.filter((p: Product) => p.category === category);
  }
  if (brand) {
    filtered = filtered.filter((p: Product) => p.brand === brand);
  }
  if (isOnSale !== undefined) {
    filtered = filtered.filter((p: Product) => p.isOnSale === isOnSale);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter((p: Product) => {
      const brandMatch = p.brand?.toLowerCase().includes(kw);
      const nameMatch = p.name?.toLowerCase().includes(kw);
      const modelMatch = p.model?.toLowerCase().includes(kw);
      return brandMatch || nameMatch || modelMatch;
    });
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    success: true,
    data: { items, total, page, pageSize },
    message: '静态数据',
  };
}

export async function getProduct(id: string): Promise<ApiResp<Product>> {
  const product = allProducts.find((p: Product) => p.id === id);
  if (!product) {
    return { success: false, data: null as unknown as Product, message: '产品不存在' };
  }
  return { success: true, data: product, message: '静态数据' };
}

export async function compareProducts(ids: string[]): Promise<ApiResp<Product[]>> {
  const products = ids
    .map((id: string) => allProducts.find((p: Product) => p.id === id))
    .filter((p): p is Product => p !== undefined);
  return { success: true, data: products, message: '静态数据' };
}
