"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const tslib_1 = require("tslib");
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const fullstack_nestjs_core_1 = require("@lark-apaas/fullstack-nestjs-core");
const product_service_1 = require("./product.service");
let ProductController = class ProductController {
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
    async compareGet(ids) {
        const idList = ids ? ids.split(',').filter(Boolean) : [];
        const data = await this.productService.compare(idList);
        return { success: true, data, message: 'ok' };
    }
    async detail(id) {
        const data = await this.productService.getById(id);
        return { success: true, data, message: 'ok' };
    }
    async create(req, body) {
        const { userId } = req.userContext;
        const data = await this.productService.create(body, userId);
        return { success: true, data, message: '创建成功' };
    }
    async update(req, id, body) {
        const { userId } = req.userContext;
        const data = await this.productService.update(id, body, userId);
        return { success: true, data, message: '更新成功' };
    }
    async remove(id) {
        await this.productService.delete(id);
        return { success: true, data: null, message: '删除成功' };
    }
    async comparePost(body) {
        const data = await this.productService.compare(body.ids || []);
        return { success: true, data, message: 'ok' };
    }
    async import(req, body) {
        const data = await this.productService.importProducts(body.category, body.rows || []);
        return { success: true, data, message: '导入完成' };
    }
};
exports.ProductController = ProductController;
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
], ProductController.prototype, "list", null);
tslib_1.__decorate([
    (0, common_1.Get)('compare'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Query)('ids')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductController.prototype, "compareGet", null);
tslib_1.__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductController.prototype, "detail", null);
tslib_1.__decorate([
    (0, fullstack_nestjs_core_1.NeedLogin)(),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductController.prototype, "create", null);
tslib_1.__decorate([
    (0, fullstack_nestjs_core_1.NeedLogin)(),
    (0, common_1.Patch)(':id'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Param)('id')),
    tslib_1.__param(2, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductController.prototype, "update", null);
tslib_1.__decorate([
    (0, fullstack_nestjs_core_1.NeedLogin)(),
    (0, common_1.Delete)(':id'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductController.prototype, "remove", null);
tslib_1.__decorate([
    (0, common_1.Post)('compare'),
    openapi.ApiResponse({ status: 201 }),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductController.prototype, "comparePost", null);
tslib_1.__decorate([
    (0, fullstack_nestjs_core_1.NeedLogin)(),
    (0, common_1.Post)('import'),
    openapi.ApiResponse({ status: 201 }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ProductController.prototype, "import", null);
exports.ProductController = ProductController = tslib_1.__decorate([
    (0, common_1.Controller)('api/products'),
    tslib_1.__metadata("design:paramtypes", [product_service_1.ProductService])
], ProductController);
