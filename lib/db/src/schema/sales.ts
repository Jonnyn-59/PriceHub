import { pgTable, serial, integer, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  units: integer("units").notNull(),
  revenue: doublePrecision("revenue").notNull(),
  profit: doublePrecision("profit").notNull(),
  marketplace: text("marketplace").notNull(),
  soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Sale = typeof salesTable.$inferSelect;
