import { db } from "./db";
import {
  cropSheets,
  healthStatusTypes,
  rows,
  plants,
  plantHealthCurrent,
  plantHealthHistory,
  attributes,
  plantAttributesCurrent,
  plantAttributesHistory,
  type InsertCropSheet,
  type InsertHealthStatusType,
  type InsertRow,
  type InsertPlant,
  type InsertAttribute,
  type InsertPlantAttributeCurrent,
  type CropSheet,
  type Row,
  type Plant,
  type PlantWithDetails,
  type HealthStatusType,
  type Attribute,
  type PlantAttributeCurrent
} from "@shared/schema";
import { eq, desc, and, sql, asc } from "drizzle-orm";

export interface IStorage {
  // Crop Sheets
  getCropSheets(): Promise<any[]>;
  getCropSheet(id: number): Promise<any>;
  createCropSheet(data: InsertCropSheet): Promise<CropSheet>;
  getCropSheetByName(name: string): Promise<CropSheet | undefined>;
  
  // Analytics
  getHealthAnalytics(cropSheetId: number): Promise<any[]>;
  getAttributeAnalytics(cropSheetId: number, attributeId: number): Promise<any[]>;

  // Health Status Types
  createHealthStatusType(data: InsertHealthStatusType): Promise<HealthStatusType>;
  updateHealthStatusType(id: number, data: { displayName: string, color: string }): Promise<HealthStatusType | undefined>;
  getHealthStatusesByCropSheet(cropSheetId: number): Promise<HealthStatusType[]>;

  // Rows
  getRows(): Promise<Row[]>;
  createRow(data: InsertRow): Promise<Row>;
  getRowByLetter(letter: string): Promise<Row | undefined>;

  // Plants
  getPlantsByCropSheet(cropSheetId: number): Promise<PlantWithDetails[]>;
  getPlant(id: number): Promise<PlantWithDetails | undefined>;
  getPlantByCode(code: string): Promise<Plant | undefined>;
  createPlant(data: InsertPlant): Promise<Plant>;
  
  // Health
  updatePlantHealth(plantId: number, statusId: number, notes?: string): Promise<any>;

  // Attributes
  getAttributes(cropSheetId?: number): Promise<Attribute[]>;
  createAttribute(data: InsertAttribute): Promise<Attribute>;
  updatePlantAttribute(plantId: number, attributeId: number, value: string): Promise<PlantAttributeCurrent>;
}

export class DatabaseStorage implements IStorage {
  async getCropSheets(): Promise<any[]> {
    return await db.query.cropSheets.findMany({
      with: { 
        healthStatuses: true,
        attributes: true 
      },
      orderBy: [desc(cropSheets.createdAt)]
    });
  }

  async getCropSheet(id: number): Promise<any> {
    return await db.query.cropSheets.findFirst({
      where: eq(cropSheets.id, id),
      with: { 
        healthStatuses: true,
        attributes: true
      }
    });
  }

  async getCropSheetByName(name: string): Promise<CropSheet | undefined> {
    return await db.query.cropSheets.findFirst({
      where: eq(cropSheets.name, name)
    });
  }

  async createCropSheet(data: InsertCropSheet): Promise<CropSheet> {
    const [sheet] = await db.insert(cropSheets).values(data).returning();
    return sheet;
  }

  async getHealthAnalytics(cropSheetId: number): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        DATE(h.checked_at) as date,
        t.display_name as status,
        COUNT(*)::int as count
      FROM plant_health_history h
      JOIN plants p ON h.plant_id = p.id
      JOIN health_status_types t ON h.status_id = t.id
      WHERE p.crop_sheet_id = ${cropSheetId}
      GROUP BY DATE(h.checked_at), t.display_name
      ORDER BY date ASC
    `);

    const reshaped: Record<string, any> = {};
    result.rows.forEach((row: any) => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      if (!reshaped[dateStr]) reshaped[dateStr] = { date: dateStr, counts: {} };
      reshaped[dateStr].counts[row.status] = row.count;
    });

    return Object.values(reshaped);
  }

  async getAttributeAnalytics(cropSheetId: number, attributeId: number): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        DATE(h.updated_at) as date,
        AVG(CAST(h.value AS DOUBLE PRECISION)) as avg,
        MIN(CAST(h.value AS DOUBLE PRECISION)) as min,
        MAX(CAST(h.value AS DOUBLE PRECISION)) as max
      FROM plant_attributes_history h
      JOIN plants p ON h.plant_id = p.id
      WHERE p.crop_sheet_id = ${cropSheetId} AND h.attribute_id = ${attributeId}
      GROUP BY DATE(h.updated_at)
      ORDER BY date ASC
    `);

    return result.rows.map((row: any) => ({
      date: new Date(row.date).toISOString().split('T')[0],
      avg: Number(row.avg),
      min: Number(row.min),
      max: Number(row.max)
    }));
  }

  async createHealthStatusType(data: InsertHealthStatusType): Promise<HealthStatusType> {
    const [status] = await db.insert(healthStatusTypes).values(data).returning();
    return status;
  }

  async updateHealthStatusType(id: number, data: { displayName: string, color: string }): Promise<HealthStatusType | undefined> {
    const [updated] = await db.update(healthStatusTypes)
      .set(data)
      .where(eq(healthStatusTypes.id, id))
      .returning();
    return updated;
  }

  async getHealthStatusesByCropSheet(cropSheetId: number): Promise<HealthStatusType[]> {
    return await db.select().from(healthStatusTypes).where(eq(healthStatusTypes.cropSheetId, cropSheetId));
  }

  async getRows(): Promise<Row[]> {
    return await db.select().from(rows).orderBy(rows.letter);
  }

  async createRow(data: InsertRow): Promise<Row> {
    const [row] = await db.insert(rows).values(data).returning();
    return row;
  }

  async getRowByLetter(letter: string): Promise<Row | undefined> {
    return await db.query.rows.findFirst({
      where: eq(rows.letter, letter)
    });
  }

  async getPlantsByCropSheet(cropSheetId: number): Promise<PlantWithDetails[]> {
    return await db.query.plants.findMany({
      where: eq(plants.cropSheetId, cropSheetId),
      with: {
        row: true,
        cropSheet: true,
        currentHealth: { with: { status: true } },
        currentAttributes: { with: { attribute: true } }
      },
      orderBy: [plants.code]
    }) as PlantWithDetails[];
  }

  async getPlant(id: number): Promise<PlantWithDetails | undefined> {
    return await db.query.plants.findFirst({
      where: eq(plants.id, id),
      with: {
        row: true,
        cropSheet: true,
        currentHealth: { with: { status: true } },
        currentAttributes: { with: { attribute: true } }
      }
    }) as PlantWithDetails | undefined;
  }

  async getPlantByCode(code: string): Promise<Plant | undefined> {
    return await db.query.plants.findFirst({
      where: eq(plants.code, code)
    });
  }

  async createPlant(data: InsertPlant): Promise<Plant> {
    const [plant] = await db.insert(plants).values(data).returning();
    return plant;
  }

  async updatePlantHealth(plantId: number, statusId: number, notes?: string): Promise<any> {
    await db.insert(plantHealthHistory).values({ plantId, statusId, notes });
    const [current] = await db.insert(plantHealthCurrent)
      .values({ plantId, statusId, notes })
      .onConflictDoUpdate({
        target: plantHealthCurrent.plantId,
        set: { statusId, notes, lastChecked: new Date() }
      })
      .returning();
    return current;
  }

  async getAttributes(cropSheetId?: number): Promise<Attribute[]> {
    if (cropSheetId) {
      return await db.select().from(attributes).where(eq(attributes.cropSheetId, cropSheetId)).orderBy(attributes.name);
    }
    return await db.select().from(attributes).orderBy(attributes.name);
  }

  async createAttribute(data: InsertAttribute): Promise<Attribute> {
    const [attr] = await db.insert(attributes).values(data).returning();
    return attr;
  }

  async updatePlantAttribute(plantId: number, attributeId: number, value: string): Promise<PlantAttributeCurrent> {
    await db.insert(plantAttributesHistory).values({ plantId, attributeId, value });
    const [current] = await db.insert(plantAttributesCurrent)
      .values({ plantId, attributeId, value })
      .onConflictDoUpdate({
        target: [plantAttributesCurrent.plantId, plantAttributesCurrent.attributeId],
        set: { value, updatedAt: new Date() }
      })
      .returning();
    return current;
  }
}

export const storage = new DatabaseStorage();
