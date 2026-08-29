"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComboSchemeModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const combo_scheme_controller_1 = require("./combo-scheme.controller");
const combo_scheme_openapi_controller_1 = require("./combo-scheme.openapi.controller");
const combo_scheme_service_1 = require("./combo-scheme.service");
let ComboSchemeModule = class ComboSchemeModule {
};
exports.ComboSchemeModule = ComboSchemeModule;
exports.ComboSchemeModule = ComboSchemeModule = tslib_1.__decorate([
    (0, common_1.Module)({
        controllers: [combo_scheme_controller_1.ComboSchemeController, combo_scheme_openapi_controller_1.ComboSchemeOpenApiController],
        providers: [combo_scheme_service_1.ComboSchemeService],
        exports: [combo_scheme_service_1.ComboSchemeService],
    })
], ComboSchemeModule);
