import {
  integer,
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  numeric,
  date,
  varchar,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const genderEnum = ["M", "F", "O"] as const;

export const farmersTable = pgTable("farmers", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  gender: text("gender", { enum: genderEnum }),
  primaryLanguage: text("primary_language"),
  village: text("village"),
  district: text("district"),
  age: integer("age"),
  educationLevel: text("education_level"),
  totalLandArea: numeric("total_land_area", { precision: 8, scale: 2 }),
  experience: numeric("farming_experience", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  completed: boolean("completed").default(false).notNull(),
});

export const insertFarmersSchema = createInsertSchema(farmersTable);

export const farmersRelations = relations(farmersTable, ({ many }) => ({
  contacts: many(farmerContactsTable),
  plots: many(farmerPlotsTable),
  assets: many(farmerAssetsTable),
  activities: many(farmerActivitiesTable),
}));

export type FarmerSelect = typeof farmersTable.$inferSelect;
export type FarmerInsert = typeof farmersTable.$inferInsert;

export const farmerContactsTable = pgTable("farmer_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: text("farmer_id")
    .notNull()
    .references(() => farmersTable.id, { onDelete: "cascade" }),
  phoneNumber: varchar("phone_number", { length: 10 }).notNull(),
  aadhaarNumber: varchar("aadhaar_number", { length: 12 }),
  email: text("email"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertFarmerContactsSchema =
  createInsertSchema(farmerContactsTable);

export const farmerContactsTableRelations = relations(
  farmerContactsTable,
  ({ one }) => ({
    farmer: one(farmersTable, {
      fields: [farmerContactsTable.farmerId],
      references: [farmersTable.id],
    }),
  })
);

export const irrigationTypeEnum = [
  "drip",
  "canal",
  "rain-fed",
  "sprinkler",
] as const;

export const soilTypeEnum = [
  "clay",
  "loamy",
  "sandy",
  "laterite",
  "black",
] as const;

export const farmerPlotsTable = pgTable("farmer_plots", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: text("farmer_id")
    .notNull()
    .references(() => farmersTable.id, { onDelete: "cascade" }),
  plotName: text("plot_name"),
  area: numeric("area", { precision: 8, scale: 2 }).notNull(),
  soilType: text("soil_type", { enum: soilTypeEnum }),
  irrigationType: text("irrigation_type", { enum: irrigationTypeEnum }),
  waterSource: text("water_source"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isOwned: boolean("is_owned").default(true),
  ownershipProofUrl: text("ownership_proof_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertFarmerPlotsSchema = createInsertSchema(farmerPlotsTable);

export const farmerPlotsTableRelations = relations(
  farmerPlotsTable,
  ({ one, many }) => ({
    farmer: one(farmersTable, {
      fields: [farmerPlotsTable.farmerId],
      references: [farmersTable.id],
    }),
    crops: many(plotCropsTable),
  })
);

export const plotCropsTable = pgTable("plot_crops", {
  id: uuid("id").defaultRandom().primaryKey(),
  plotId: uuid("plot_id")
    .notNull()
    .references(() => farmerPlotsTable.id, { onDelete: "cascade" }),
  cropName: text("crop_name").notNull(),
  variety: text("variety"),
  season: text("season"),
  sowingDate: date("sowing_date"),
  expectedHarvestDate: date("expected_harvest_date"),
  currentStage: text("current_stage"),
  estimatedYieldKg: numeric("estimated_yield_kg", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertPlotCropsSchema = createInsertSchema(plotCropsTable);

export const plotCropsTableRelations = relations(plotCropsTable, ({ one }) => ({
  plot: one(farmerPlotsTable, {
    fields: [plotCropsTable.plotId],
    references: [farmerPlotsTable.id],
  }),
}));

export const farmerAssetsTable = pgTable("farmer_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: text("farmer_id")
    .notNull()
    .references(() => farmersTable.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(),
  brand: text("brand"),
  quantity: integer("quantity").default(1),
  condition: text("condition"),
  acquiredDate: date("acquired_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertFarmerAssetsSchema = createInsertSchema(farmerAssetsTable);

export const farmerAssetsTableRelations = relations(
  farmerAssetsTable,
  ({ one }) => ({
    farmer: one(farmersTable, {
      fields: [farmerAssetsTable.farmerId],
      references: [farmersTable.id],
    }),
  })
);

export const activityTypeEnum = [
  "watering",
  "fertilizing",
  "pesticide",
  "harvesting",
  "sowing",
  "plowing",
] as const;

export const farmerActivitiesTable = pgTable("farmer_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: text("farmer_id")
    .notNull()
    .references(() => farmersTable.id, { onDelete: "cascade" }),
  plotId: uuid("plot_id").references(() => farmerPlotsTable.id, {
    onDelete: "set null",
  }),
  activityType: text("activity_type", { enum: activityTypeEnum }).notNull(),
  cropName: text("crop_name"),
  date: date("date").defaultNow(),
  description: text("description"),
  validated: boolean("validated").default(false),
  source: text("source").default("voice"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFarmerActivitiesSchema = createInsertSchema(
  farmerActivitiesTable
);

export const farmerActivitiesRelations = relations(
  farmerActivitiesTable,
  ({ one }) => ({
    farmer: one(farmersTable, {
      fields: [farmerActivitiesTable.farmerId],
      references: [farmersTable.id],
    }),
    plot: one(farmerPlotsTable, {
      fields: [farmerActivitiesTable.plotId],
      references: [farmerPlotsTable.id],
    }),
  })
);
