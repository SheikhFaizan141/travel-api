import { z } from "zod";

export const ListingSchema = z.object({
  name: z.string().max(255),
  description: z.string().max(500),
  rating: z.number().optional(),
  address: z.string().max(255),
  city: z.string().max(255),
  zip: z.string().max(6),
  phone: z.string(),
  email: z.string().email(),
  website: z.string().url(),
  categoryId: z.number(),
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
