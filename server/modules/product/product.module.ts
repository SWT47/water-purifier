import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductOpenApiController } from './product.openapi.controller';
import { ProductService } from './product.service';

@Module({
  controllers: [ProductController, ProductOpenApiController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
