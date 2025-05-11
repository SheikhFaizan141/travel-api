import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const IdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
