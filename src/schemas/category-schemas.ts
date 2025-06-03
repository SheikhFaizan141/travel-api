import { z } from "zod";

// Schema for category validation
export const CategorySchema = z.object({
  name: z.string().max(255),
  slug: z
    .string()
    .max(500)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z.string().trim().max(500).optional(),
  banner_image: z.instanceof(File).optional(),
  icon: z.string().optional(),

  //   featureIds: z.array(z.number().int().positive()).optional().default([])

  featureIds: z
    .string()
    .transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str);
        const validated = z
          .array(z.number().int().positive())
          .safeParse(parsed);
        if (!validated.success) throw new Error("Invalid feature IDs");
        return validated.data;
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "featureIds must be a JSON array of positive integers",
        });
        return z.NEVER;
      }
    })
    .optional()
    .default("[]")
    .transform((val) => (Array.isArray(val) ? val : [])),
});

// Schema for update validation
export const UpdateCategorySchema = CategorySchema.extend({
  banner_image: z
    .union([z.instanceof(File), z.string().url(), z.literal("")])
    .optional(),
})
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for a PATCH request",
  });
