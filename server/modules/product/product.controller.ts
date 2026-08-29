import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { ProductService } from './product.service';
import type {
  ApiResp,
  Product,
  ProductCategory,
  ProductCreateInput,
  ProductListResult,
  ImportResult,
} from '@shared/api.interface';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async list(
    @Query('category') category?: ProductCategory,
    @Query('keyword') keyword?: string,
    @Query('brand') brand?: string,
    @Query('isOnSale') isOnSale?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ApiResp<ProductListResult>> {
    const data = await this.productService.list({
      category,
      keyword,
      brand,
      isOnSale: isOnSale !== undefined ? isOnSale === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { success: true, data, message: 'ok' };
  }

  @Get('compare')
  async compareGet(@Query('ids') ids?: string): Promise<ApiResp<Product[]>> {
    const idList: string[] = ids ? ids.split(',').filter(Boolean) : [];
    const data = await this.productService.compare(idList);
    return { success: true, data, message: 'ok' };
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<ApiResp<Product>> {
    const data = await this.productService.getById(id);
    return { success: true, data, message: 'ok' };
  }

  @NeedLogin()
  @Post()
  async create(
    @Req() req: Request,
    @Body() body: ProductCreateInput,
  ): Promise<ApiResp<Product>> {
    const { userId } = req.userContext;
    const data = await this.productService.create(body, userId);
    return { success: true, data, message: '创建成功' };
  }

  @NeedLogin()
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: Partial<ProductCreateInput>,
  ): Promise<ApiResp<Product>> {
    const { userId } = req.userContext;
    const data = await this.productService.update(id, body, userId);
    return { success: true, data, message: '更新成功' };
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResp<null>> {
    await this.productService.delete(id);
    return { success: true, data: null, message: '删除成功' };
  }

  @Post('compare')
  async comparePost(@Body() body: { ids: string[] }): Promise<ApiResp<Product[]>> {
    const data = await this.productService.compare(body.ids || []);
    return { success: true, data, message: 'ok' };
  }

  @NeedLogin()
  @Post('import')
  async import(
    @Req() req: Request,
    @Body() body: { category: ProductCategory; rows: Record<string, unknown>[] },
  ): Promise<ApiResp<ImportResult>> {
    const data = await this.productService.importProducts(
      body.category,
      body.rows || [],
    );
    return { success: true, data, message: '导入完成' };
  }
}
