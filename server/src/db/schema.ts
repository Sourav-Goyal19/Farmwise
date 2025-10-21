import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["M", "F", "O"]);

export const farmersTable = pgTable("farmers", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  gender: genderEnum(),
  primaryLanguage: text("primary_language"),
  village: text("village"),
  district: text("district"),
  age: integer("age"),
  educationLevel: text("education_level"),
  totalLandArea: decimal("total_land_area"),
  experience: decimal("farming_experience"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  completed: boolean("completed").default(false).notNull(),
});

export type FarmerSelect = typeof farmersTable.$inferSelect;
export type FarmerInsert = typeof farmersTable.$inferInsert;
