import type { Request } from 'express';
import { ProductService } from './product.service';
import type { ApiResp, Product, ProductCategory, ProductCreateInput, ProductListResult, ImportResult } from '@shared/api.interface';
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    list(category?: ProductCategory, keyword?: string, brand?: string, isOnSale?: string, page?: string, pageSize?: string): Promise<ApiResp<ProductListResult>>;
    compareGet(ids?: string): Promise<ApiResp<Product[]>>;
    detail(id: string): Promise<ApiResp<Product>>;
    create(req: Request, body: ProductCreateInput): Promise<ApiResp<Product>>;
    update(req: Request, id: string, body: Partial<ProductCreateInput>): Promise<ApiResp<Product>>;
    remove(id: string): Promise<ApiResp<null>>;
    comparePost(body: {
        ids: string[];
    }): Promise<ApiResp<Product[]>>;
    import(req: Request, body: {
        category: ProductCategory;
        rows: Record<string, unknown>[];
    }): Promise<ApiResp<ImportResult>>;
}
