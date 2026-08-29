import { type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import type { ComboScheme, ComboSchemeCreateInput, ComboSchemeUpdateInput } from '@shared/api.interface';
export declare class ComboSchemeService {
    private readonly db;
    private readonly logger;
    constructor(db: PostgresJsDatabase);
    private rowToScheme;
    list(): Promise<ComboScheme[]>;
    create(input: ComboSchemeCreateInput): Promise<ComboScheme>;
    update(id: string, input: ComboSchemeUpdateInput): Promise<ComboScheme>;
    remove(id: string): Promise<void>;
}
