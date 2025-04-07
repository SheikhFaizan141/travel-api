import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const IdSchema = z.object({
  id: z.preprocess((val) => {
    return typeof val === "string" ? Number.parseInt(val, 10) : val;
  }, z.number().int().positive()),
});
