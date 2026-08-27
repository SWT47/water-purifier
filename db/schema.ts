import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const product = pgTable(
  'product',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: varchar('category', { length: 50 }).notNull(),
    brand: varchar('brand', { length: 255 }),
    name: varchar('name', { length: 255 }),
    model: varchar('model', { length: 255 }),
    whiteBgImage: text('white_bg_image'),
    launchYear: varchar('launch_year', { length: 20 }),
    isOnSale: boolean('is_on_sale').default(true),
    dailyPrice: numeric('daily_price'),
    referencePrice: numeric('reference_price'),
    flux: varchar('flux', { length: 100 }),
    waterFlowRate: varchar('water_flow_rate', { length: 100 }),
    faucet: varchar('faucet', { length: 100 }),
    dimensions: varchar('dimensions', { length: 255 }),
    waterMode: varchar('water_mode', { length: 255 }),
    roMembraneBrand: varchar('ro_membrane_brand', { length: 100 }),
    filterTotalCost: numeric('filter_total_cost'),
    activatedCarbon: varchar('activated_carbon', { length: 255 }),
    hasMaternityCert: boolean('has_maternity_cert').default(false),
    hasZeroStagnantWater: boolean('has_zero_stagnant_water').default(false),
    realImages: text('real_images').array().default([]),
    realVideos: text('real_videos').array().default([]),
    heatingElement: varchar('heating_element', { length: 100 }),
    heatingCapacity: varchar('heating_capacity', { length: 100 }),
    tempControl: varchar('temp_control', { length: 255 }),
    hasWaterTank: boolean('has_water_tank').default(false),
    isAutomatic: boolean('is_automatic').default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_product_category').on(table.category),
    index('idx_product_brand').on(table.brand),
    index('idx_product_is_on_sale').on(table.isOnSale),
  ],
);

export const comboScheme = pgTable(
  'combo_scheme',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    productIds: uuid('product_ids').array().notNull().default([]),
    livePrice: numeric('live_price'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_combo_scheme_created_at').on(table.createdAt),
  ],
);

export type ProductRow = typeof product.$inferSelect;
export type ProductInsert = typeof product.$inferInsert;
export type ComboSchemeRow = typeof comboScheme.$inferSelect;
export type ComboSchemeInsert = typeof comboScheme.$inferInsert;
