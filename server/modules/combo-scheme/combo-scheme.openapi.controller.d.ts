import { ComboSchemeService } from './combo-scheme.service';
import type { ComboScheme } from '@shared/api.interface';
export declare class ComboSchemeOpenApiController {
    private readonly comboSchemeService;
    constructor(comboSchemeService: ComboSchemeService);
    list(): Promise<{
        success: boolean;
        data: ComboScheme[];
        message: string;
    }>;
}
