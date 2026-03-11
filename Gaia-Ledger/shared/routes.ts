import { z } from 'zod';
import { 
  insertCropSheetSchema, 
  insertHealthStatusTypeSchema, 
  insertRowSchema, 
  insertPlantSchema, 
  insertAttributeSchema,
  cropSheets,
  healthStatusTypes,
  rows,
  plants,
  plantHealthCurrent,
  attributes,
  plantAttributesCurrent
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  conflict: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
};

export const api = {
  cropSheets: {
    list: {
      method: 'GET' as const,
      path: '/api/crop-sheets' as const,
      responses: {
        200: z.array(z.custom<any>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/crop-sheets' as const,
      input: insertCropSheetSchema,
      responses: {
        201: z.custom<typeof cropSheets.$inferSelect>(),
        400: errorSchemas.validation,
        409: errorSchemas.conflict,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/crop-sheets/:id' as const,
      responses: {
        200: z.custom<any>(),
        404: errorSchemas.notFound,
      },
    },
    grid: {
      method: 'GET' as const,
      path: '/api/crop-sheets/:id/grid' as const,
      responses: {
        200: z.object({
          rows: z.array(z.custom<typeof rows.$inferSelect>()),
          plants: z.array(z.custom<any>())
        }),
      },
    },
    healthAnalytics: {
      method: 'GET' as const,
      path: '/api/crop-sheets/:id/analytics/health' as const,
      responses: {
        200: z.array(z.object({
          date: z.string(),
          counts: z.record(z.string(), z.number())
        })),
      },
    },
    attributeAnalytics: {
      method: 'GET' as const,
      path: '/api/crop-sheets/:id/analytics/attributes/:attributeId' as const,
      responses: {
        200: z.array(z.object({
          date: z.string(),
          avg: z.number(),
          min: z.number(),
          max: z.number()
        })),
      },
    },
    updateHealth: {
      method: 'POST' as const,
      path: '/api/plants/:id/health' as const,
      responses: {
        200: z.custom<any>(),
      },
    }
  },
  plants: {
    list: {
      method: 'GET' as const,
      path: '/api/plants' as const,
      responses: {
        200: z.array(z.custom<any>()), 
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/plants' as const,
      input: insertPlantSchema,
      responses: {
        201: z.custom<any>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/plants/:id' as const,
      responses: {
        200: z.custom<any>(),
        404: errorSchemas.notFound,
      },
    },
    updateAttribute: {
      method: 'POST' as const,
      path: '/api/plants/:id/attributes' as const,
      input: z.object({
        attributeId: z.number(),
        value: z.string(),
      }),
      responses: {
        200: z.custom<typeof plantAttributesCurrent.$inferSelect>(),
      },
    }
  },
  rows: {
    list: {
      method: 'GET' as const,
      path: '/api/rows' as const,
      responses: {
        200: z.array(z.custom<any>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/rows' as const,
      input: insertRowSchema,
      responses: {
        201: z.custom<any>(),
      },
    }
  },
  healthStatuses: {
    list: {
      method: 'GET' as const,
      path: '/api/health-statuses' as const,
      responses: {
        200: z.array(z.custom<any>()),
      },
    }
  },
  export: {
    cropSheet: {
      method: 'GET' as const,
      path: '/api/export/crop-sheets/:id' as const,
      responses: {
        200: z.any(), // Binary stream
      },
    },
    all: {
      method: 'GET' as const,
      path: '/api/export/all' as const,
      responses: {
        200: z.any(), // Binary stream
      },
    }
  },
  attributes: {
    list: {
      method: 'GET' as const,
      path: '/api/attributes' as const,
      responses: {
        200: z.array(z.custom<typeof attributes.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/attributes' as const,
      input: insertAttributeSchema,
      responses: {
        201: z.custom<typeof attributes.$inferSelect>(),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
