import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  type InsertPlant, 
  type InsertRow, 
  type InsertCropSheet,
  type Plant,
  type Row,
  type CropSheet,
  type HealthStatusType,
  type PlantHealthCurrent
} from "@shared/schema";

// === PLANTS ===

export function usePlants() {
  return useQuery({
    queryKey: [api.plants.list.path],
    queryFn: async () => {
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
      const res = await fetch("/api/health-statuses");
      if (!res.ok) throw new Error("Failed to fetch health statuses");
      return (await res.json());
    },
  });
}
