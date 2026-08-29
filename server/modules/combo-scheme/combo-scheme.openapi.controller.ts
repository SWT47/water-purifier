import { Controller, Get } from '@nestjs/common';
import { ComboSchemeService } from './combo-scheme.service';
import type { ComboScheme } from '@shared/api.interface';

@Controller('openapi/combo-schemes')
export class ComboSchemeOpenApiController {
  constructor(private readonly comboSchemeService: ComboSchemeService) {}

  @Get()
  async list(): Promise<{ success: boolean; data: ComboScheme[]; message: string }> {
    const data = await this.comboSchemeService.list();
    return { success: true, data, message: 'ok' };
  }
}
