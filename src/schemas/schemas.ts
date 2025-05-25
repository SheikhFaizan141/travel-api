import { z } from "zod";
import { locationSchema } from "./location-schemas";

export const IdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const WorkingHourSchema = z
  .object({
    day: z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]),
    is24Hour: z.boolean().default(false),
    openingTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)")
      .optional(),
    closingTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.is24Hour) {
      // Require both times
      if (!data.openingTime || !data.closingTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Both times required when not 24h",
          path: ["openingTime"],
        });
      }

      // Validate time order
      if (data.openingTime && data.closingTime) {
        const [openH, openM] = data.openingTime.split(":").map(Number);
        const [closeH, closeM] = data.closingTime.split(":").map(Number);

        if (openH > closeH || (openH === closeH && openM >= closeM)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Closing time must be after opening time",
            path: ["closingTime"],
          });
        }
      }
    }
  });

export type WorkingHour = z.infer<typeof WorkingHourSchema>;

export const ListingSchema = z.object({
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
  
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90").optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180").optional(),

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

  description: z.string().max(500),

  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
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

export const slugSchema = z.object({
  params: z.object({
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(255, "Slug must not exceed 255 characters")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message:
          "Slug must contain only lowercase letters, numbers, and hyphens",
      }),
  }),
});

export type ListingSlugSchema = z.infer<typeof slugSchema>;
