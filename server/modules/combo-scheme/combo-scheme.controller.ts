import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { ComboSchemeService } from './combo-scheme.service';
import type {
  ComboScheme,
  ComboSchemeCreateInput,
  ComboSchemeUpdateInput,
} from '@shared/api.interface';

@Controller('api/combo-schemes')
export class ComboSchemeController {
  constructor(private readonly comboSchemeService: ComboSchemeService) {}

  @Get()
  async list(): Promise<{ success: boolean; data: ComboScheme[]; message: string }> {
    const data = await this.comboSchemeService.list();
    return { success: true, data, message: 'ok' };
  }

  @NeedLogin()
  @Post()
  async create(
    @Body() body: ComboSchemeCreateInput,
  ): Promise<{ success: boolean; data: ComboScheme; message: string }> {
    const data = await this.comboSchemeService.create(body);
    return { success: true, data, message: 'ok' };
  }

  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: ComboSchemeUpdateInput,
  ): Promise<{ success: boolean; data: ComboScheme; message: string }> {
    const data = await this.comboSchemeService.update(id, body);
    return { success: true, data, message: 'ok' };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: null; message: string }> {
    await this.comboSchemeService.remove(id);
    return { success: true, data: null, message: 'ok' };
  }
}
