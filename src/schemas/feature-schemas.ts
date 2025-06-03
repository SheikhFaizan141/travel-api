import { z } from "zod";

export const createFeatureSchema = z.object({
  name: z.string().min(2).max(50),
});

export const updateFeatureSchema = z.object({
  name: z.string().min(2).max(50).optional(),
});
