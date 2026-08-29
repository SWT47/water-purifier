"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductOpenApiController = void 0;
const tslib_1 = require("tslib");
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const product_service_1 = require("./product.service");
let ProductOpenApiController = class ProductOpenApiController {
    productService;
    constructor(productService) {
        this.productService = productService;
    }
    async list(category, keyword, brand, isOnSale, page, pageSize) {
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
    async compare(ids) {
        const idList = ids ? ids.split(',').filter(Boolean) : [];
        const data = await this.productService.compare(idList);
        return { success: true, data, message: 'ok' };
    }
    async detail(id) {
        const data = await this.productService.getById(id);
        return { success: true, data, message: 'ok' };
    }
};
exports.ProductOpenApiController = ProductOpenApiController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Query)('category')),
    tslib_1.__param(1, (0, common_1.Query)('keyword')),
    tslib_1.__param(2, (0, common_1.Query)('brand')),
    tslib_1.__param(3, (0, common_1.Query)('isOnSale')),
    tslib_1.__param(4, (0, common_1.Query)('page')),
    tslib_1.__param(5, (0, common_1.Query)('pageSize')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, String, String, String, String]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductOpenApiController.prototype, "list", null);
tslib_1.__decorate([
    (0, common_1.Get)('compare'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Query)('ids')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductOpenApiController.prototype, "compare", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductOpenApiController.prototype, "detail", null);
exports.ProductOpenApiController = ProductOpenApiController = tslib_1.__decorate([
    (0, common_1.Controller)('openapi/products'),
    tslib_1.__metadata("design:paramtypes", [product_service_1.ProductService])
], ProductOpenApiController);
