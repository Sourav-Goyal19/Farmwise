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
  notifications: many(notificationsTable),
  documents: many(farmerDocumentsTable),
}));

export type FarmerSelectType = typeof farmersTable.$inferSelect;
export type FarmerInsertType = typeof farmersTable.$inferInsert;

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

export type FarmerContactSelectType = typeof farmerContactsTable.$inferSelect;
export type FarmerContactInsertType = typeof farmerContactsTable.$inferInsert;

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

export type FarmerPlotSelectType = typeof farmerPlotsTable.$inferSelect;
export type FarmerPlotInsertType = typeof farmerPlotsTable.$inferInsert;

export const plotCropsTable = pgTable("plot_crops", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: text("farmer_id")
    .notNull()
    .default("user_34c6elREuvpi47h78L7seEkBE9o")
    .references(() => farmersTable.id, { onDelete: "cascade" }),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const insertPlotCropsSchema = createInsertSchema(plotCropsTable);

export const plotCropsTableRelations = relations(plotCropsTable, ({ one }) => ({
  plot: one(farmerPlotsTable, {
    fields: [plotCropsTable.plotId],
    references: [farmerPlotsTable.id],
  }),
  farmer: one(farmersTable, {
    fields: [plotCropsTable.farmerId],
    references: [farmersTable.id],
  }),
}));

export type PlotCropSelectType = typeof plotCropsTable.$inferSelect;
export type PlotCropInsertType = typeof plotCropsTable.$inferInsert;

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

export type FarmerAssetSelectType = typeof farmerAssetsTable.$inferSelect;
export type FarmerAssetInsertType = typeof farmerAssetsTable.$inferInsert;

export const activityTypeEnum = [
  "irrigation",
  "pesticide",
  "fertilizer",
  "sowing",
  "plowing",
  "weeding",
  "harvest",
  "transport",
  "sales",
  "inspection",
  "maintenance",
  "other",
] as const;

export const activityLogsTable = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  cropId: uuid("crop_id")
    .notNull()
    .references(() => plotCropsTable.id, { onDelete: "cascade" }),
  farmerId: text("created_by")
    .notNull()
    .references(() => farmersTable.id, {
      onDelete: "set null",
    }),
  activityType: text("activity_type", { enum: activityTypeEnum }).notNull(),
  details: text("details").array().notNull(),
  summary: text("summary").notNull(),
  said: text("farmer_said").notNull(),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  suggestions: text("suggestions").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogsTable);

export const activityLogsRelations = relations(
  activityLogsTable,
  ({ one }) => ({
    crop: one(plotCropsTable, {
      fields: [activityLogsTable.cropId],
      references: [plotCropsTable.id],
    }),
    farmer: one(farmersTable, {
      fields: [activityLogsTable.farmerId],
      references: [farmersTable.id],
    }),
  })
);

export type ActivityLogSelectType = typeof activityLogsTable.$inferSelect;
export type ActivityLogInsertType = typeof activityLogsTable.$inferInsert;

export const notificationsTypeEnum = ["reminder", "alert", "message"] as const;

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: text("farmer_id")
    .references(() => farmersTable.id, { onDelete: "cascade" })
    .notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: notificationsTypeEnum }).notNull(),
  scheduledFor: timestamp("scheduled_for", { mode: "date" }),
  isRead: boolean("is_read").default(false).notNull(),
  isSent: boolean("is_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  jobId: text("job_id"),
});

export const insertNotificationsSchema = createInsertSchema(notificationsTable);

export const notificationsRelations = relations(
  notificationsTable,
  ({ one }) => ({
    farmer: one(farmersTable, {
      fields: [notificationsTable.farmerId],
      references: [farmersTable.id],
    }),
  })
);

export type NotificationSelectType = typeof notificationsTable.$inferSelect;
export type NotificationInsertType = typeof notificationsTable.$inferInsert;

export const schemesTable = pgTable("schemes", {
  id: uuid("id").defaultRandom().primaryKey(),
  schemeName: text("scheme_name").notNull(),
  state: text("state"),
  ministry: text("ministry").notNull(),
  benefit: text("benefit").notNull(),
  objective: text("objective").array().notNull(),
  eligibilityCriteria: text("eligibility_criteria").array().notNull(),
  exclusions: text("exclusions").array(),
  documentsRequired: text("documents_required").array().notNull(),
  applicationProcess: text("application_process").notNull(),
  officialWebsite: text("official_website").notNull(),
  lastUpdatedAt: date("last_updated_at").notNull(),
  features: text("features").array(),
  components: text("components").array(),
  targets: text("targets").array(),
  deadline: date("deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSchemeSchema = createInsertSchema(schemesTable);

export type SchemeSelectType = typeof schemesTable.$inferSelect;
export type SchemeInsertType = typeof schemesTable.$inferInsert;

export const farmerDocumentsTable = pgTable("farmer_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: text("farmer_id")
    .references(() => farmersTable.id, { onDelete: "cascade" })
    .notNull(),
  documentType: text("document_type").notNull(),
  documentUrl: text("document_url").notNull(),
  verifiedAt: timestamp("verified_at"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertFarmerDocumentsSchema =
  createInsertSchema(farmerDocumentsTable);

export const farmerDocumentsRelations = relations(
  farmerDocumentsTable,
  ({ one }) => ({
    farmer: one(farmersTable, {
      fields: [farmerDocumentsTable.farmerId],
      references: [farmersTable.id],
    }),
  })
);

export type FarmerDocumentSelectType = typeof farmerDocumentsTable.$inferSelect;
export type FarmerDocumentInsertType = typeof farmerDocumentsTable.$inferInsert;

export const schemeRequiredDocumentsTable = pgTable(
  "scheme_required_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schemeId: uuid("scheme_id")
      .references(() => schemesTable.id, { onDelete: "cascade" })
      .notNull(),
    documentType: text("document_type").notNull(),
    isMandatory: boolean("is_mandatory").default(true),
  }
);

export const insertSchemeRequiredDocumentsSchema = createInsertSchema(
  schemeRequiredDocumentsTable
);

export const schemeRequiredDocumentsRelations = relations(
  schemeRequiredDocumentsTable,
  ({ one }) => ({
    scheme: one(schemesTable, {
      fields: [schemeRequiredDocumentsTable.schemeId],
      references: [schemesTable.id],
    }),
  })
);

export type SchemeRequiredDocumentSelectType =
  typeof schemeRequiredDocumentsTable.$inferSelect;
export type SchemeRequiredDocumentInsertType =
  typeof schemeRequiredDocumentsTable.$inferInsert;

export const farmerSchemeMatchingTable = pgTable("farmer_scheme_matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: text("farmer_id")
    .references(() => farmersTable.id, { onDelete: "cascade" })
    .notNull(),
  schemeId: uuid("scheme_id").references(() => schemesTable.id, {
    onDelete: "cascade",
  }),
  reason: text("reason").notNull(),
  isEligible: boolean("is_eligible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inserFarmerSchemeMatchingSchema = createInsertSchema(
  farmerSchemeMatchingTable
);

export const farmerSchemeMatchingRelations = relations(
  farmerSchemeMatchingTable,
  ({ one }) => ({
    farmer: one(farmersTable, {
      fields: [farmerSchemeMatchingTable.farmerId],
      references: [farmersTable.id],
    }),
    scheme: one(schemesTable, {
      fields: [farmerSchemeMatchingTable.schemeId],
      references: [schemesTable.id],
    }),
  })
);

export type FarmerSchemeMatchingSelectType =
  typeof farmerSchemeMatchingTable.$inferSelect;
export type FarmerSchemeMatchingInsertType =
  typeof farmerSchemeMatchingTable.$inferInsert;

const applicationStatusEnum = [
  "not_applied",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
] as const;

export const schemeApplicationsTable = pgTable("scheme_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: text("farmer_id")
    .references(() => farmersTable.id, { onDelete: "cascade" })
    .notNull(),
  schemeId: uuid("scheme_id")
    .references(() => schemesTable.id, { onDelete: "cascade" })
    .notNull(),
  applicationStatus: text("application_status", {
    enum: applicationStatusEnum,
  })
    .default("not_applied")
    .notNull(),
  appliedOn: timestamp("applied_on").notNull(),
  updatedOn: timestamp("updated_on")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertSchemeApplicationsSchema = createInsertSchema(
  schemeApplicationsTable
);

export const schemeApplicationsRelations = relations(
  schemeApplicationsTable,
  ({ one }) => ({
    farmer: one(farmersTable, {
      fields: [schemeApplicationsTable.farmerId],
      references: [farmersTable.id],
    }),
    scheme: one(schemesTable, {
      fields: [schemeApplicationsTable.schemeId],
      references: [schemesTable.id],
    }),
  })
);

export type SchemeApplicationsSelectType =
  typeof schemeApplicationsTable.$inferSelect;
export type SchemeApplicationsInsertType =
  typeof schemeApplicationsTable.$inferInsert;
