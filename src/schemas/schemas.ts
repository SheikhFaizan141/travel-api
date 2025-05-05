import { z } from "zod";

export const IdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const ListingSchema = z.object({
  name: z.string().max(255),
  description: z.string().max(500),
  rating: z.number().optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  zip: z.string().max(6).optional(),
  phone: z.string(),
  email: z.string().email().optional(),
  website: z.string().url(),

  categoryId: z.coerce.number(),
});

// Schema for update validation
export const UpdateListingSchema = ListingSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required for update",
  }
);

// Schema for location validation
export const LocationSchema = z.object({
  name: z.string().max(255),
  slug: z.string().max(500),
  description: z.string().max(500),
  parent: z.coerce.number().int().positive().optional(),
});

export const UpdateLocationSchema = LocationSchema.extend({
  featured_image: z.string().optional(),
})
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for a PATCH request",
  });

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
