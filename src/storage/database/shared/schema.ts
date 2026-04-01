import { pgTable, serial, timestamp, varchar, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const assets = pgTable(
  "assets",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    asset_id: varchar("asset_id", { length: 100 }).notNull(), // 火山引擎返回的资产ID
    name: varchar("name", { length: 255 }).notNull(), // 素材名称
    url: text("url").notNull(), // 素材URL
    asset_type: varchar("asset_type", { length: 20 }).notNull(), // Image/Video/Audio
    status: varchar("status", { length: 20 }).notNull().default("Processing"), // Active/Processing/Failed
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("assets_asset_id_idx").on(table.asset_id),
    index("assets_status_idx").on(table.status),
    index("assets_created_at_idx").on(table.created_at),
  ]
);
