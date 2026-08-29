import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import type {
  ApiResp,
  Product,
  ProductCategory,
  ProductListResult,
} from '@shared/api.interface';

@Controller('openapi/products')
export class ProductOpenApiController {
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
  async compare(@Query('ids') ids?: string): Promise<ApiResp<Product[]>> {
    const idList: string[] = ids ? ids.split(',').filter(Boolean) : [];
    const data = await this.productService.compare(idList);
    return { success: true, data, message: 'ok' };
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<ApiResp<Product>> {
    const data = await this.productService.getById(id);
    return { success: true, data, message: 'ok' };
  }
}
