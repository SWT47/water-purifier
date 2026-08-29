"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComboSchemeController = void 0;
const tslib_1 = require("tslib");
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const fullstack_nestjs_core_1 = require("@lark-apaas/fullstack-nestjs-core");
const combo_scheme_service_1 = require("./combo-scheme.service");
let ComboSchemeController = class ComboSchemeController {
    comboSchemeService;
    constructor(comboSchemeService) {
        this.comboSchemeService = comboSchemeService;
    }
    async list() {
        const data = await this.comboSchemeService.list();
        return { success: true, data, message: 'ok' };
    }
    async create(body) {
        const data = await this.comboSchemeService.create(body);
        return { success: true, data, message: 'ok' };
    }
    async update(id, body) {
        const data = await this.comboSchemeService.update(id, body);
        return { success: true, data, message: 'ok' };
    }
    async remove(id) {
        await this.comboSchemeService.remove(id);
        return { success: true, data: null, message: 'ok' };
    }
};
exports.ComboSchemeController = ComboSchemeController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ComboSchemeController.prototype, "list", null);
tslib_1.__decorate([
    (0, fullstack_nestjs_core_1.NeedLogin)(),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ComboSchemeController.prototype, "create", null);
tslib_1.__decorate([
    (0, fullstack_nestjs_core_1.NeedLogin)(),
    (0, common_1.Put)(':id'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], ComboSchemeController.prototype, "update", null);
tslib_1.__decorate([
    (0, fullstack_nestjs_core_1.NeedLogin)(),
    (0, common_1.Delete)(':id'),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], ComboSchemeController.prototype, "remove", null);
exports.ComboSchemeController = ComboSchemeController = tslib_1.__decorate([
    (0, common_1.Controller)('api/combo-schemes'),
    tslib_1.__metadata("design:paramtypes", [combo_scheme_service_1.ComboSchemeService])
], ComboSchemeController);
