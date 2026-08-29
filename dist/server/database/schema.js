"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productTable = exports.comboSchemeTable = exports.product = exports.comboScheme = exports.fileAttachmentArray = exports.userProfileArray = exports.fileAttachment = exports.userProfile = exports.customTimestamptz = void 0;
exports.escapeLiteral = escapeLiteral;
/* eslint-disable */
/** auto generated, do not edit */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
exports.customTimestamptz = (0, pg_core_1.customType)({
    dataType(config) {
        const precision = typeof config?.precision !== 'undefined'
            ? ` (${config.precision})`
            : '';
        return `timestamptz${precision}`;
    },
    toDriver(value) {
        if (value == null)
            return value;
        if (typeof value === 'number')
            return new Date(value).toISOString();
        if (typeof value === 'string')
            return value;
        if (value instanceof Date)
            return value.toISOString();
        throw new Error('Invalid timestamp value');
    },
    fromDriver(value) {
        if (value instanceof Date)
            return value;
        return new Date(value);
    },
});
exports.userProfile = (0, pg_core_1.customType)({
    dataType() {
        return 'user_profile';
    },
    toDriver(value) {
        return (0, drizzle_orm_1.sql) `ROW(${value})::user_profile`;
    },
    fromDriver(value) {
        const [userId] = value.slice(1, -1).split(',');
        return userId.trim();
    },
});
exports.fileAttachment = (0, pg_core_1.customType)({
    dataType() {
        return 'file_attachment';
    },
    toDriver(value) {
        return (0, drizzle_orm_1.sql) `ROW(${value.bucket_id},${value.file_path})::file_attachment`;
    },
    fromDriver(value) {
        const [bucketId, filePath] = value.slice(1, -1).split(',');
        return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    },
});
function escapeLiteral(str) {
    return "'" + str.replace(/'/g, "''") + "'";
}
exports.userProfileArray = (0, pg_core_1.customType)({
    dataType() {
        return 'user_profile[]';
    },
    toDriver(value) {
        if (!value || value.length === 0) {
            return (0, drizzle_orm_1.sql) `'{}'::user_profile[]`;
        }
        const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
        return drizzle_orm_1.sql.raw(`ARRAY[${elements}]::user_profile[]`);
    },
    fromDriver(value) {
        if (!value || value === '{}')
            return [];
        const inner = value.slice(1, -1);
        const matches = inner.match(/\([^)]*\)/g) || [];
        return matches.map(m => m.slice(1, -1).split(',')[0].trim());
    },
});
exports.fileAttachmentArray = (0, pg_core_1.customType)({
    dataType() {
        return 'file_attachment[]';
    },
    toDriver(value) {
        if (!value || value.length === 0) {
            return (0, drizzle_orm_1.sql) `'{}'::file_attachment[]`;
        }
        const elements = value.map(f => `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`).join(',');
        return drizzle_orm_1.sql.raw(`ARRAY[${elements}]::file_attachment[]`);
    },
    fromDriver(value) {
        if (!value || value === '{}')
            return [];
        const inner = value.slice(1, -1);
        const matches = inner.match(/\([^)]*\)/g) || [];
        return matches.map(m => {
            const [bucketId, filePath] = m.slice(1, -1).split(',');
            return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
        });
    },
});
exports.comboScheme = (0, pg_core_1.pgTable)("combo_scheme", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)("name", { length: 200 }).notNull(),
    productIds: (0, pg_core_1.uuid)("product_ids").array().notNull().default([]),
    livePrice: (0, pg_core_1.numeric)("live_price"),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: (0, exports.userProfile)("_created_by").default((0, drizzle_orm_1.sql) `CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: (0, exports.userProfile)("_updated_by").default((0, drizzle_orm_1.sql) `CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
    // Complex index: CREATE INDEX idx_combo_scheme_created_by ON combo_scheme USING btree (((_created_by).user_id)),
    (0, pg_core_1.index)("idx_combo_scheme_created_at").on(table.createdAt),
]);
exports.product = (0, pg_core_1.pgTable)("product", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    category: (0, pg_core_1.varchar)("category", { length: 50 }).notNull(),
    brand: (0, pg_core_1.varchar)("brand", { length: 255 }),
    name: (0, pg_core_1.varchar)("name", { length: 255 }),
    model: (0, pg_core_1.varchar)("model", { length: 255 }),
    whiteBgImage: (0, pg_core_1.text)("white_bg_image"),
    launchYear: (0, pg_core_1.varchar)("launch_year", { length: 20 }),
    isOnSale: (0, pg_core_1.boolean)("is_on_sale").default(true),
    dailyPrice: (0, pg_core_1.numeric)("daily_price"),
    referencePrice: (0, pg_core_1.numeric)("reference_price"),
    flux: (0, pg_core_1.varchar)("flux", { length: 100 }),
    waterFlowRate: (0, pg_core_1.varchar)("water_flow_rate", { length: 100 }),
    faucet: (0, pg_core_1.varchar)("faucet", { length: 100 }),
    dimensions: (0, pg_core_1.varchar)("dimensions", { length: 255 }),
    waterMode: (0, pg_core_1.varchar)("water_mode", { length: 255 }),
    roMembraneBrand: (0, pg_core_1.varchar)("ro_membrane_brand", { length: 100 }),
    filterTotalCost: (0, pg_core_1.numeric)("filter_total_cost"),
    activatedCarbon: (0, pg_core_1.varchar)("activated_carbon", { length: 255 }),
    hasMaternityCert: (0, pg_core_1.boolean)("has_maternity_cert").default(false),
    hasZeroStagnantWater: (0, pg_core_1.boolean)("has_zero_stagnant_water").default(false),
    realImages: (0, pg_core_1.text)("real_images").array().default([]),
    realVideos: (0, pg_core_1.text)("real_videos").array().default([]),
    heatingElement: (0, pg_core_1.varchar)("heating_element", { length: 100 }),
    heatingCapacity: (0, pg_core_1.varchar)("heating_capacity", { length: 100 }),
    tempControl: (0, pg_core_1.varchar)("temp_control", { length: 255 }),
    hasWaterTank: (0, pg_core_1.boolean)("has_water_tank").default(false),
    isAutomatic: (0, pg_core_1.boolean)("is_automatic").default(false),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: (0, exports.customTimestamptz)("_created_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: (0, exports.userProfile)("_created_by").default((0, drizzle_orm_1.sql) `CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: (0, exports.customTimestamptz)("_updated_at", { precision: 3 }).notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: (0, exports.userProfile)("_updated_by").default((0, drizzle_orm_1.sql) `CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
    (0, pg_core_1.index)("idx_product_category").on(table.category),
    (0, pg_core_1.index)("idx_product_brand").on(table.brand),
    (0, pg_core_1.index)("idx_product_is_on_sale").on(table.isOnSale),
]);
// table aliases
exports.comboSchemeTable = exports.comboScheme;
exports.productTable = exports.product;
