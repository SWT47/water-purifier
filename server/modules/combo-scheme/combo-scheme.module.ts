import { Module } from '@nestjs/common';
import { ComboSchemeController } from './combo-scheme.controller';
import { ComboSchemeOpenApiController } from './combo-scheme.openapi.controller';
import { ComboSchemeService } from './combo-scheme.service';

@Module({
  controllers: [ComboSchemeController, ComboSchemeOpenApiController],
  providers: [ComboSchemeService],
  exports: [ComboSchemeService],
})
export class ComboSchemeModule {}
