import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const cropSheets = pgTable("crop_sheets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthStatusTypes = pgTable("health_status_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), 
  displayName: text("display_name").notNull(), 
  color: text("color").notNull().default("#22c55e"),
  cropSheetId: integer("crop_sheet_id").references(() => cropSheets.id, { onDelete: "cascade" }),
});

export const rows = pgTable("rows", {
  id: serial("id").primaryKey(),
  letter: text("letter").notNull().unique(),
});

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  number: integer("number").notNull(),
  plantedDate: timestamp("planted_date"),
  status: text("status").default("Active"),
  rowId: integer("row_id").notNull().references(() => rows.id),
  cropSheetId: integer("crop_sheet_id").references(() => cropSheets.id),
});

export const plantHealthCurrent = pgTable("plant_health_current", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull().unique().references(() => plants.id, { onDelete: "cascade" }),
  statusId: integer("status_id").notNull().references(() => healthStatusTypes.id),
  notes: text("notes"),
  lastChecked: timestamp("last_checked").defaultNow(),
});

export const plantHealthHistory = pgTable("plant_health_history", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull().references(() => plants.id, { onDelete: "cascade" }),
  statusId: integer("status_id").notNull().references(() => healthStatusTypes.id),
  notes: text("notes"),
  checkedAt: timestamp("checked_at").defaultNow(),
});

export const attributes = pgTable("attributes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'text', 'number', 'percentage', 'boolean', 'date'
  cropSheetId: integer("crop_sheet_id").references(() => cropSheets.id, { onDelete: "cascade" }),
});

export const plantAttributesCurrent = pgTable("plant_attributes_current", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull().references(() => plants.id, { onDelete: "cascade" }),
  attributeId: integer("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const plantAttributesHistory = pgTable("plant_attributes_history", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull().references(() => plants.id, { onDelete: "cascade" }),
  attributeId: integer("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === RELATIONS ===

export const cropSheetsRelations = relations(cropSheets, ({ many }) => ({
  plants: many(plants),
  healthStatuses: many(healthStatusTypes),
  attributes: many(attributes),
}));

export const healthStatusTypesRelations = relations(healthStatusTypes, ({ one, many }) => ({
  cropSheet: one(cropSheets, {
    fields: [healthStatusTypes.cropSheetId],
    references: [cropSheets.id],
  }),
  currentHealthRecords: many(plantHealthCurrent),
  historyRecords: many(plantHealthHistory),
}));

export const rowsRelations = relations(rows, ({ many }) => ({
  plants: many(plants),
}));

export const plantsRelations = relations(plants, ({ one, many }) => ({
  row: one(rows, {
    fields: [plants.rowId],
    references: [rows.id],
  }),
  cropSheet: one(cropSheets, {
    fields: [plants.cropSheetId],
    references: [cropSheets.id],
  }),
  currentHealth: one(plantHealthCurrent, {
    fields: [plants.id],
    references: [plantHealthCurrent.plantId],
  }),
  healthHistory: many(plantHealthHistory),
  currentAttributes: many(plantAttributesCurrent),
  attributeHistory: many(plantAttributesHistory),
}));

export const plantHealthCurrentRelations = relations(plantHealthCurrent, ({ one }) => ({
  plant: one(plants, {
    fields: [plantHealthCurrent.plantId],
    references: [plants.id],
  }),
  status: one(healthStatusTypes, {
    fields: [plantHealthCurrent.statusId],
    references: [healthStatusTypes.id],
  }),
}));

export const plantHealthHistoryRelations = relations(plantHealthHistory, ({ one }) => ({
  plant: one(plants, {
    fields: [plantHealthHistory.plantId],
    references: [plants.id],
  }),
  status: one(healthStatusTypes, {
    fields: [plantHealthHistory.statusId],
    references: [healthStatusTypes.id],
  }),
}));

export const attributesRelations = relations(attributes, ({ one, many }) => ({
  cropSheet: one(cropSheets, {
    fields: [attributes.cropSheetId],
    references: [cropSheets.id],
  }),
  currentVals: many(plantAttributesCurrent),
  historyVals: many(plantAttributesHistory),
}));

export const plantAttributesCurrentRelations = relations(plantAttributesCurrent, ({ one }) => ({
  plant: one(plants, {
    fields: [plantAttributesCurrent.plantId],
    references: [plants.id],
  }),
  attribute: one(attributes, {
    fields: [plantAttributesCurrent.attributeId],
    references: [attributes.id],
  }),
}));

export const plantAttributesHistoryRelations = relations(plantAttributesHistory, ({ one }) => ({
  plant: one(plants, {
    fields: [plantAttributesHistory.plantId],
    references: [plants.id],
  }),
  attribute: one(attributes, {
    fields: [plantAttributesHistory.attributeId],
    references: [attributes.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertCropSheetSchema = createInsertSchema(cropSheets).omit({ id: true, createdAt: true });
export const insertHealthStatusTypeSchema = createInsertSchema(healthStatusTypes).omit({ id: true });
export const insertRowSchema = createInsertSchema(rows).omit({ id: true });
export const insertPlantSchema = createInsertSchema(plants).omit({ id: true });
export const insertPlantHealthCurrentSchema = createInsertSchema(plantHealthCurrent).omit({ id: true, lastChecked: true });
export const insertPlantHealthHistorySchema = createInsertSchema(plantHealthHistory).omit({ id: true, checkedAt: true });
export const insertAttributeSchema = createInsertSchema(attributes).omit({ id: true });
export const insertPlantAttributeCurrentSchema = createInsertSchema(plantAttributesCurrent).omit({ id: true, updatedAt: true });
export const insertPlantAttributeHistorySchema = createInsertSchema(plantAttributesHistory).omit({ id: true, updatedAt: true });

// === TYPES ===

export type CropSheet = typeof cropSheets.$inferSelect;
export type InsertCropSheet = z.infer<typeof insertCropSheetSchema>;

export type HealthStatusType = typeof healthStatusTypes.$inferSelect;
export type InsertHealthStatusType = z.infer<typeof insertHealthStatusTypeSchema>;

export type Row = typeof rows.$inferSelect;
export type InsertRow = z.infer<typeof insertRowSchema>;

export type Plant = typeof plants.$inferSelect;
export type InsertPlant = z.infer<typeof insertPlantSchema>;

export type PlantHealthCurrent = typeof plantHealthCurrent.$inferSelect;
export type InsertPlantHealthCurrent = z.infer<typeof insertPlantHealthCurrentSchema>;

export type PlantHealthHistory = typeof plantHealthHistory.$inferSelect;
export type InsertPlantHealthHistory = z.infer<typeof insertPlantHealthHistorySchema>;

export type Attribute = typeof attributes.$inferSelect;
export type InsertAttribute = z.infer<typeof insertAttributeSchema>;

export type PlantAttributeCurrent = typeof plantAttributesCurrent.$inferSelect;
export type InsertPlantAttributeCurrent = z.infer<typeof insertPlantAttributeCurrentSchema>;

export type PlantAttributeHistory = typeof plantAttributesHistory.$inferSelect;
export type InsertPlantAttributeHistory = z.infer<typeof insertPlantAttributeHistorySchema>;

// Composite Types for API Responses
export type PlantWithDetails = Plant & {
  row: Row;
  cropSheet: CropSheet | null;
  currentHealth: (PlantHealthCurrent & { status: HealthStatusType }) | null;
  currentAttributes: (PlantAttributeCurrent & { attribute: Attribute })[];
};
