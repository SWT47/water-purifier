import { ComboSchemeService } from './combo-scheme.service';
import type { ComboScheme, ComboSchemeCreateInput, ComboSchemeUpdateInput } from '@shared/api.interface';
export declare class ComboSchemeController {
    private readonly comboSchemeService;
    constructor(comboSchemeService: ComboSchemeService);
    list(): Promise<{
        success: boolean;
        data: ComboScheme[];
        message: string;
    }>;
    create(body: ComboSchemeCreateInput): Promise<{
        success: boolean;
        data: ComboScheme;
        message: string;
    }>;
    update(id: string, body: ComboSchemeUpdateInput): Promise<{
        success: boolean;
        data: ComboScheme;
        message: string;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        data: null;
        message: string;
    }>;
}
