"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCategorySchema = exports.CategorySchema = exports.UpdateLocationSchema = exports.LocationSchema = exports.UpdateListingSchema = exports.ListingSchema = exports.IdSchema = void 0;
const zod_1 = require("zod");
exports.IdSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
const WorkingHourSchema = zod_1.z
    .object({
    day: zod_1.z.enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]),
    is24Hour: zod_1.z.boolean().default(false),
    openingTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)")
        .optional(),
    closingTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)")
        .optional(),
})
    .superRefine((data, ctx) => {
    if (!data.is24Hour) {
        // Require both times
        if (!data.openingTime || !data.closingTime) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
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
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "Closing time must be after opening time",
                    path: ["closingTime"],
                });
            }
        }
    }
});
exports.ListingSchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(255),
    description: zod_1.z.string().max(500),
    rating: zod_1.z.number().optional(),
    address: zod_1.z.string().max(255).optional(),
    city: zod_1.z.string().max(255).optional(),
    zip: zod_1.z.string().max(6).optional(),
    phone: zod_1.z.string(),
    email: zod_1.z.string().email().optional(),
    website: zod_1.z.string().url(),
    priceRange: zod_1.z
        .enum(["notsay", "inexpensive", "moderate", "pricey", "luxurious"])
        .optional(),
    priceFrom: zod_1.z.coerce.number().nonnegative().optional(),
    priceTo: zod_1.z.coerce.number().positive().optional(),
    workingHours: zod_1.z
        .array(WorkingHourSchema)
        .max(7, "Cannot have more than 7 days")
        .refine((items) => {
        const days = items.map((i) => i.day);
        return new Set(days).size === days.length;
    }, "Duplicate days found")
        .optional(),
    categoryId: zod_1.z.coerce.number(),
});
// Schema for update validation
exports.UpdateListingSchema = exports.ListingSchema.partial().refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
});
// Schema for location validation
exports.LocationSchema = zod_1.z.object({
    name: zod_1.z.string().max(255),
    slug: zod_1.z.string().max(500),
    description: zod_1.z.string().max(500),
    parent: zod_1.z.coerce.number().int().positive().optional(),
});
exports.UpdateLocationSchema = exports.LocationSchema.extend({
    featured_image: zod_1.z.string().optional(),
})
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for a PATCH request",
});
// Schema for category validation
exports.CategorySchema = zod_1.z.object({
    name: zod_1.z.string().max(255),
    slug: zod_1.z
        .string()
        .max(500)
        .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    description: zod_1.z.string().trim().max(500).optional(),
    banner_image: zod_1.z.instanceof(File).optional(),
    icon: zod_1.z.string().optional(),
});
// Schema for update validation
exports.UpdateCategorySchema = exports.CategorySchema.extend({
    banner_image: zod_1.z
        .union([zod_1.z.instanceof(File), zod_1.z.string().url(), zod_1.z.literal("")])
        .optional(),
})
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for a PATCH request",
});
