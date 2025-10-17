import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  decimal,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["M", "F", "O"]);

export const farmersTable = pgTable("farmers", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  gender: genderEnum().notNull(),
  primaryLanguage: text("primary_language").notNull(),
  village: text("village").notNull(),
  district: text("district"),
  age: integer("age").notNull(),
  educationLevel: text("education_level"),
  totalLandArea: decimal("total_land_area").notNull(),
  experience: decimal("farming_experience").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export type FarmerSelect = typeof farmersTable.$inferSelect;
export type FarmerInsert = typeof farmersTable.$inferInsert;
