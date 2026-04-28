import { pgTable, serial, text, integer, doublePrecision, boolean } from "drizzle-orm/pg-core";

export const marketplaceListingsTable = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  description: text("description"),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  currency: text("currency").notNull().default("RUB"),
});

export const marketplaceOffersTable = pgTable("marketplace_offers", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  marketplace: text("marketplace").notNull(),
  price: doublePrecision("price").notNull(),
  url: text("url").notNull(),
  inStock: boolean("in_stock").notNull().default(true),
  deliveryDays: integer("delivery_days").notNull().default(2),
  rating: doublePrecision("rating").notNull().default(4.5),
});

export type MarketplaceListing = typeof marketplaceListingsTable.$inferSelect;
export type MarketplaceOffer = typeof marketplaceOffersTable.$inferSelect;
