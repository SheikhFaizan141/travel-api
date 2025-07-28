import { z } from "zod";
import { WorkingHourSchema } from "./schemas";

export const BaseListingSchema = z.object({
  name: z.string().min(3).max(255),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    })
    .optional(),
  rating: z.number().optional(),

  // Address and map fields
  address: z.string().min(1, "Address is required").optional(),

  latitude: z.coerce
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z.coerce
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),

  // extra fields
  city: z.string().max(255).optional(),
  zip: z.string().max(6).optional(),

  phone: z.string(),
  email: z.string().email().optional(),
  website: z.string().url(),

  priceRange: z
    .enum(["notsay", "inexpensive", "moderate", "pricey", "luxurious"])
    .optional(),

  priceFrom: z.coerce.number().nonnegative().optional(),
  priceTo: z.coerce.number().positive().optional(),

  workingHours: z
    .array(WorkingHourSchema)
    .max(7, "Cannot have more than 7 days")
    .refine((items) => {
      const days = items.map((i) => i.day);
      return new Set(days).size === days.length;
    }, "Duplicate days found")
    .optional(),

  categoryId: z.coerce.number(),
  features: z.array(z.coerce.number()).optional(),

  description: z.string().max(500),

  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional(),

  locationId: z.coerce.number().int().nonnegative().optional(),
});

export const ListingSchema = BaseListingSchema.refine(
  (data) =>
    (data.latitude === undefined && data.longitude === undefined) ||
    (data.latitude !== undefined && data.longitude !== undefined),
  {
    message:
      "Both latitude and longitude must be provided together, or neither",
    path: ["latitude", "longitude"],
  }
);

export const PRICE_RANGE_ENUM = [
  "notsay",
  "inexpensive",
  "moderate",
  "pricey",
  "luxurious",
] as const;

export type PriceRangeEnum = (typeof PRICE_RANGE_ENUM)[number];

export const priceRangeSchema = z
  .string()
  .transform((val, ctx): PriceRangeEnum[] => {
    const ranges = val.split(",").map((r) => r.trim());
    const invalidValues = ranges.filter(
      (r) => !PRICE_RANGE_ENUM.includes(r as PriceRangeEnum)
    );

    if (invalidValues.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid price range values: ${invalidValues.join(", ")}`,
      });
      return z.NEVER;
    }
    return ranges as PriceRangeEnum[];
  })
  .optional();

export const featuresSchema = z
  .string()
  .transform((val) => val.split(",").map((id) => parseInt(id.trim())))
  .refine((ids) => ids.every((id) => !isNaN(id)), {
    message: "Features must be comma-separated numbers",
  })
  .optional();
