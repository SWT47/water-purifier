import { ProductService } from './product.service';
import type { ApiResp, Product, ProductCategory, ProductListResult } from '@shared/api.interface';
export declare class ProductOpenApiController {
    private readonly productService;
    constructor(productService: ProductService);
    list(category?: ProductCategory, keyword?: string, brand?: string, isOnSale?: string, page?: string, pageSize?: string): Promise<ApiResp<ProductListResult>>;
    compare(ids?: string): Promise<ApiResp<Product[]>>;
    detail(id: string): Promise<ApiResp<Product>>;
}
