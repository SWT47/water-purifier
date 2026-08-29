"use strict";
var ComboSchemeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComboSchemeService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const fullstack_nestjs_core_1 = require("@lark-apaas/fullstack-nestjs-core");
const schema_1 = require("../../database/schema");
const drizzle_orm_1 = require("drizzle-orm");
let ComboSchemeService = ComboSchemeService_1 = class ComboSchemeService {
    db;
    logger = new common_1.Logger(ComboSchemeService_1.name);
    constructor(db) {
        this.db = db;
    }
    rowToScheme(row) {
        const numOrNull = (val) => {
            if (val === null || val === undefined)
                return null;
            const n = Number(val);
            return Number.isNaN(n) ? null : n;
        };
        return {
            id: row.id,
            name: row.name,
            productIds: row.productIds ?? [],
            livePrice: numOrNull(row.livePrice),
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        };
    }
    async list() {
        const rows = await this.db
            .select()
            .from(schema_1.comboScheme)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.comboScheme.updatedAt));
        return rows.map((r) => this.rowToScheme(r));
    }
    async create(input) {
        if (!input.name?.trim()) {
            throw new common_1.BadRequestException('方案名称不能为空');
        }
        if (!input.productIds || input.productIds.length === 0) {
            throw new common_1.BadRequestException('至少选择一个产品');
        }
        const rows = await this.db
            .insert(schema_1.comboScheme)
            .values({
            name: input.name.trim(),
            productIds: input.productIds,
            livePrice: input.livePrice != null ? String(input.livePrice) : null,
        })
            .returning();
        return this.rowToScheme(rows[0]);
    }
    async update(id, input) {
        const patch = {};
        if (input.name !== undefined) {
            if (!input.name.trim())
                throw new common_1.BadRequestException('方案名称不能为空');
            patch.name = input.name.trim();
        }
        if (input.productIds !== undefined) {
            if (input.productIds.length === 0) {
                throw new common_1.BadRequestException('至少选择一个产品');
            }
            patch.productIds = input.productIds;
        }
        if (input.livePrice !== undefined) {
            patch.livePrice = input.livePrice != null ? String(input.livePrice) : null;
        }
        if (Object.keys(patch).length === 0) {
            throw new common_1.BadRequestException('未提供可更新字段');
        }
        patch.updatedAt = new Date();
        const rows = await this.db
            .update(schema_1.comboScheme)
            .set(patch)
            .where((0, drizzle_orm_1.eq)(schema_1.comboScheme.id, id))
            .returning();
        if (rows.length === 0) {
            throw new common_1.NotFoundException('方案不存在');
        }
        return this.rowToScheme(rows[0]);
    }
    async remove(id) {
        const rows = await this.db
            .delete(schema_1.comboScheme)
            .where((0, drizzle_orm_1.eq)(schema_1.comboScheme.id, id))
            .returning({ id: schema_1.comboScheme.id });
        if (rows.length === 0) {
            throw new common_1.NotFoundException('方案不存在');
        }
    }
};
exports.ComboSchemeService = ComboSchemeService;
exports.ComboSchemeService = ComboSchemeService = ComboSchemeService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(fullstack_nestjs_core_1.DRIZZLE_DATABASE)),
    tslib_1.__metadata("design:paramtypes", [Function])
], ComboSchemeService);
