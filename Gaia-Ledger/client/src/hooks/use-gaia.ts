import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  type InsertPlant, 
  type InsertRow, 
  type InsertCropSheet,
  type Plant,
  type Row,
  type CropSheet,
  type PlantWithDetails,
  type HealthStatusType,
  type PlantHealthCurrent,
  type Attribute
} from "@shared/schema";

const isStaticHost = typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
const LOCAL_STORAGE_KEY = "gaia-raft-static-backend";

type LocalData = {
  rows: Row[];
  cropSheets: (CropSheet & { healthStatuses: HealthStatusType[]; attributes: Attribute[] })[];
  plants: PlantWithDetails[];
};

const defaultLocalData: LocalData = {
  rows: [
    { id: 1, letter: "A" },
    { id: 2, letter: "B" },
    { id: 3, letter: "C" },
  ],
  cropSheets: [
    {
      id: 1,
      name: "Demo Crop Sheet",
      description: "Github Pages static demo",
      isActive: true,
      createdAt: new Date(),
      healthStatuses: [
        { id: 1, name: "Healthy", displayName: "Healthy", color: "#22c55e", cropSheetId: 1 },
        { id: 2, name: "Dehydrated", displayName: "Dehydrated", color: "#eab308", cropSheetId: 1 },
      ],
      attributes: [],
    },
  ],
  plants: [
    {
      id: 1,
      code: "A1",
      number: 1,
      plantedDate: new Date(),
      status: "Active",
      rowId: 1,
      cropSheetId: 1,
      row: { id: 1, letter: "A" },
      cropSheet: {
        id: 1,
        name: "Demo Crop Sheet",
        description: "Github Pages static demo",
        isActive: true,
        createdAt: new Date(),
      },
      currentHealth: {
        id: 1,
        plantId: 1,
        statusId: 1,
        notes: "Initial healthy status",
        lastChecked: new Date(),
        status: { id: 1, name: "Healthy", displayName: "Healthy", color: "#22c55e", cropSheetId: 1 },
      },
      currentAttributes: [],
    },
  ],
};

function getLocalData(): LocalData {
  if (typeof window === "undefined") {
    return defaultLocalData;
  }

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultLocalData));
    return defaultLocalData;
  }

  try {
    return JSON.parse(raw) as LocalData;
  } catch {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultLocalData));
    return defaultLocalData;
  }
}

function setLocalData(data: LocalData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}


// === PLANTS ===

export function usePlants() {
  return useQuery({
    queryKey: [api.plants.list.path],
    queryFn: async () => {
      if (isStaticHost) {
        return getLocalData().plants;
      }
      const res = await fetch(api.plants.list.path);
      if (!res.ok) throw new Error("Failed to fetch plants");
      return api.plants.list.responses[200].parse(await res.json());
    },
  });
}

export function usePlant(id: number) {
  return useQuery({
    queryKey: [api.plants.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.plants.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch plant");
      return api.plants.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreatePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertPlant) => {
      if (isStaticHost) {
        const local = getLocalData();
        const newId = Math.max(0, ...local.plants.map((p) => p.id)) + 1;
        const row = local.rows.find((r) => r.id === data.rowId);
        const cropSheet = local.cropSheets.find((s) => s.id === data.cropSheetId) || null;
        const healthStatus = cropSheet?.healthStatuses?.[0] || null;
        const newPlant: PlantWithDetails = {
          id: newId,
          code: data.code || `${row?.letter || "R"}${data.number}`,
          number: data.number,
          plantedDate: (data as any).plantedDate || new Date(),
          status: data.status || "Active",
          rowId: data.rowId,
          cropSheetId: data.cropSheetId || null,
          row: row as Row,
          cropSheet,
          currentHealth: healthStatus
            ? {
                id: newId,
                plantId: newId,
                statusId: healthStatus.id,
                notes: "Initialized",
                lastChecked: new Date(),
                status: healthStatus,
              }
            : null,
          currentAttributes: [],
        };
        local.plants = [...local.plants, newPlant];
        setLocalData(local);
        queryClient.invalidateQueries({ queryKey: [api.plants.list.path] });
        return newPlant;
      }

      const res = await fetch(api.plants.create.path, {
        method: api.plants.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create plant");
      }
      return api.plants.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.plants.list.path] });
    },
  });
}

export function useUpdatePlantHealth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statusId, notes }: { id: number; statusId: number; notes?: string }) => {
      if (isStaticHost) {
        const local = getLocalData();
        const plantIndex = local.plants.findIndex((p) => p.id === id);
        if (plantIndex === -1) throw new Error("Plant not found in local demo data");

        const status = local.cropSheets
          .find((sheet) => sheet.id === local.plants[plantIndex].cropSheetId)
          ?.healthStatuses.find((hs) => hs.id === statusId) ?? null;

        const updatedHealth = status
          ? {
              id: id,
              plantId: id,
              statusId,
              notes: notes ?? null,
              lastChecked: new Date(),
              status,
            }
          : null;

        local.plants[plantIndex] = {
          ...local.plants[plantIndex],
          currentHealth: updatedHealth,
        };

        setLocalData(local);
        queryClient.invalidateQueries({ queryKey: [api.plants.list.path] });
        queryClient.invalidateQueries({ queryKey: [api.plants.get.path, id] });
        queryClient.invalidateQueries({ queryKey: [api.cropSheets.grid.path] });

        return updatedHealth;
      }

      const url = buildUrl(api.cropSheets.updateHealth.path, { id });
      const res = await fetch(url, {
        method: api.cropSheets.updateHealth.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId, notes }),
      });
      if (!res.ok) throw new Error("Failed to update plant health");
      return api.cropSheets.updateHealth.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.plants.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.plants.get.path, variables.id] });
      queryClient.invalidateQueries({ queryKey: [api.cropSheets.grid.path] });
    },
  });
}

// === ROWS ===

export function useRows() {
  return useQuery({
    queryKey: ["/api/rows"], // Fallback if api.rows is missing
    queryFn: async () => {
      if (isStaticHost) {
        return getLocalData().rows;
      }
      const res = await fetch("/api/rows");
      if (!res.ok) throw new Error("Failed to fetch rows");
      return (await res.json());
    },
  });
}

export function useCreateRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRow) => {
      const res = await fetch("/api/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create row");
      }
      return (await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rows"] });
    },
  });
}

// === CROP SHEETS ===

export function useCropSheets() {
  return useQuery({
    queryKey: [api.cropSheets.list.path],
    queryFn: async () => {
      if (isStaticHost) {
        return getLocalData().cropSheets;
      }
      const res = await fetch(api.cropSheets.list.path);
      if (!res.ok) throw new Error("Failed to fetch crop sheets");
      return api.cropSheets.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCropSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCropSheet) => {
      const res = await fetch(api.cropSheets.create.path, {
        method: api.cropSheets.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create crop sheet");
      }
      return api.cropSheets.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cropSheets.list.path] });
    },
  });
}

// === HEALTH STATUSES ===

export function useHealthStatuses() {
  return useQuery({
    queryKey: ["/api/health-statuses"],
    queryFn: async () => {
      if (isStaticHost) {
        const local = getLocalData();
        return local.cropSheets.flatMap((sheet) => sheet.healthStatuses);
      }
      const res = await fetch("/api/health-statuses");
      if (!res.ok) throw new Error("Failed to fetch health statuses");
      return (await res.json());
    },
  });
}
