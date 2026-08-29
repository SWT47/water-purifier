import { type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import type { Product, ProductCategory, ProductCreateInput, ProductListParams, ProductListResult, ImportResult } from '@shared/api.interface';
export declare class ProductService {
    private readonly db;
    private readonly logger;
    constructor(db: PostgresJsDatabase);
    private rowToProduct;
    private inputToInsert;
    list(params: ProductListParams): Promise<ProductListResult>;
    getById(id: string): Promise<Product>;
    create(input: ProductCreateInput, userId: string): Promise<Product>;
    update(id: string, patch: Partial<ProductCreateInput>, userId: string): Promise<Product>;
    delete(id: string): Promise<void>;
    compare(ids: string[]): Promise<Product[]>;
    importProducts(category: ProductCategory, rows: Record<string, unknown>[]): Promise<ImportResult>;
    private parseImportRow;
}
