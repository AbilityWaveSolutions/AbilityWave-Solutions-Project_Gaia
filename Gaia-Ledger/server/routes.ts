import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import ExcelJS from "exceljs";
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === CROP SHEETS ===
  app.get(api.cropSheets.list.path, async (req, res) => {
    const sheets = await storage.getCropSheets();
    res.json(sheets);
  });

  app.post(api.cropSheets.create.path, async (req, res) => {
    try {
      const input = api.cropSheets.create.input.parse(req.body);
      const existing = await storage.getCropSheetByName(input.name);
      if (existing) {
        return res.status(409).json({ message: "Crop sheet already exists", code: "CROPSHEET_002" });
      }

      const sheet = await storage.createCropSheet(input);

      const templates = [
        { name: 'Healthy', color: '#22c55e' },
        { name: 'Dehydrated', color: '#eab308' },
        { name: 'Fungus', color: '#78350f' },
        { name: 'Pest Damage', color: '#ef4444' },
        { name: 'Nutrient Deficiency', color: '#f97316' },
        { name: 'Not Checked', color: '#6b7280' }
      ];

      const timestamp = Date.now();
      for (const template of templates) {
        await storage.createHealthStatusType({
          name: `${template.name}_${sheet.id}_${timestamp}`,
          displayName: template.name,
          color: template.color,
          cropSheetId: sheet.id,
        });
      }

      const fullSheet = await storage.getCropSheet(sheet.id);
      res.status(201).json(fullSheet);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.cropSheets.get.path, async (req, res) => {
    const sheet = await storage.getCropSheet(Number(req.params.id));
    if (!sheet) return res.status(404).json({ message: "Crop sheet not found" });
    res.json(sheet);
  });

  app.get(api.cropSheets.grid.path, async (req, res) => {
    const cropSheetId = Number(req.params.id);
    const rows = await storage.getRows();
    const plants = await storage.getPlantsByCropSheet(cropSheetId);
    res.json({ rows, plants });
  });

  app.get(api.cropSheets.healthAnalytics.path, async (req, res) => {
    const history = await storage.getHealthAnalytics(Number(req.params.id));
    res.json(history);
  });

  app.get(api.cropSheets.attributeAnalytics.path, async (req, res) => {
    const result = await storage.getAttributeAnalytics(Number(req.params.id), Number(req.params.attributeId));
    res.json(result);
  });

  app.post(api.cropSheets.updateHealth.path, async (req, res) => {
    try {
      const { statusId, notes } = req.body;
      const result = await storage.updatePlantHealth(Number(req.params.id), Number(statusId), notes);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === PLANTS ===
  app.get(api.plants.list.path, async (req, res) => {
    const cropSheetId = req.query.cropSheetId ? Number(req.query.cropSheetId) : undefined;
    if (cropSheetId) {
      const plants = await storage.getPlantsByCropSheet(cropSheetId);
      return res.json(plants);
    }
    const plants = await db.query.plants.findMany({
      with: {
        row: true,
        cropSheet: true,
        currentHealth: { with: { status: true } },
        currentAttributes: { with: { attribute: true } }
      }
    });
    res.json(plants);
  });

  app.post(api.plants.create.path, async (req, res) => {
    try {
      const input = api.plants.create.input.parse(req.body);
      const plant = await storage.createPlant(input);
      res.status(201).json(plant);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.plants.get.path, async (req, res) => {
    const plant = await storage.getPlant(Number(req.params.id));
    if (!plant) return res.status(404).json({ message: "Plant not found" });
    res.json(plant);
  });

  app.post(api.plants.updateAttribute.path, async (req, res) => {
    try {
      const { attributeId, value } = req.body;
      const result = await storage.updatePlantAttribute(Number(req.params.id), Number(attributeId), value);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === ROWS ===
  app.get(api.rows.list.path, async (req, res) => {
    const rows = await storage.getRows();
    res.json(rows);
  });

  app.post(api.rows.create.path, async (req, res) => {
    try {
      const input = api.rows.create.input.parse(req.body);
      const row = await storage.createRow(input);
      res.status(201).json(row);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === HEALTH STATUSES ===
  app.get(api.healthStatuses.list.path, async (req, res) => {
    const cropSheetId = req.query.cropSheetId ? Number(req.query.cropSheetId) : undefined;
    if (cropSheetId) {
      const statuses = await storage.getHealthStatusesByCropSheet(cropSheetId);
      return res.json(statuses);
    }
    const statuses = await db.query.healthStatusTypes.findMany();
    res.json(statuses);
  });

  // === ATTRIBUTES ===
  app.get(api.attributes.list.path, async (req, res) => {
    const cropSheetId = req.query.cropSheetId ? Number(req.query.cropSheetId) : undefined;
    const attrs = await storage.getAttributes(cropSheetId);
    res.json(attrs);
  });

  app.post(api.attributes.create.path, async (req, res) => {
    try {
      const input = api.attributes.create.input.parse(req.body);
      const attr = await storage.createAttribute(input);
      res.status(201).json(attr);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === EXPORT ===
  app.get(api.export.cropSheet.path, async (req, res) => {
    const id = Number(req.params.id);
    const sheet = await storage.getCropSheet(id);
    if (!sheet) return res.status(404).send("Not found");

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Overview');
    ws.columns = [
      { header: 'Property', key: 'prop', width: 20 },
      { header: 'Value', key: 'val', width: 40 }
    ];
    ws.addRow({ prop: 'Name', val: sheet.name });
    ws.addRow({ prop: 'Description', val: sheet.description });
    ws.addRow({ prop: 'Created', val: new Date(sheet.createdAt).toLocaleString() });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=crop_sheet_${id}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  });

  async function seedDatabase() {
    const rowsResult = await storage.getRows();
    if (rowsResult.length === 0) {
      console.log("Seeding database...");
      const rowLetters = ['A', 'B', 'C', 'D', 'E'];
      const createdRows = [];
      for (const letter of rowLetters) {
        createdRows.push(await storage.createRow({ letter }));
      }

      const sheet = await storage.createCropSheet({
        name: "Spring 2026",
        description: "Initial planting for the season",
        isActive: true
      });

      const templates = [
        { name: 'Healthy', color: '#22c55e' },
        { name: 'Dehydrated', color: '#eab308' },
        { name: 'Fungus', color: '#78350f' },
        { name: 'Pest Damage', color: '#ef4444' },
        { name: 'Nutrient Deficiency', color: '#f97316' },
        { name: 'Not Checked', color: '#6b7280' }
      ];
      const timestamp = Date.now();
      const statuses = [];
      for (const template of templates) {
        statuses.push(await storage.createHealthStatusType({
          name: `${template.name}_${sheet.id}_${timestamp}`,
          displayName: template.name,
          color: template.color,
          cropSheetId: sheet.id,
        }));
      }

      const rowA = createdRows[0];
      const healthyStatus = statuses.find(s => s.displayName === 'Healthy');
      for (let i = 1; i <= 10; i++) {
        const plant = await storage.createPlant({
          code: `A${i}`,
          number: i,
          rowId: rowA.id,
          cropSheetId: sheet.id,
          status: 'Active',
          plantedDate: new Date(),
        });
        if (healthyStatus) {
           await storage.updatePlantHealth(plant.id, healthyStatus.id, "Initial planting");
        }
      }
      console.log("Seeding complete.");
    }
  }

  seedDatabase();
  return httpServer;
}
