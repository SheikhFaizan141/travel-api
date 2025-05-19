"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listingIdSchema = void 0;
const express_1 = __importDefault(require("express"));
const locationController_1 = require("../controllers/admin/locationController");
const filesystems_1 = __importDefault(require("../config/filesystems"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
// import validate from "../middleware/validationMiddleware";
// import { UpdateListingSchema } from "../schemas/schemas.js";
// import multer from "multer";
const router = express_1.default.Router();
// router.use("/", clientRoutes);
router.use("/admin", adminRoutes_1.default);
// location routes here
router.get("/locations", locationController_1.getLocations);
// // get location route
router.get("/locations/:id", locationController_1.getLocation);
// // create location route
router.post("/locations", filesystems_1.default.single("featured_image"), locationController_1.createLocation);
// // update location route
router.patch("/locations/:id", filesystems_1.default.single("featured_image"), locationController_1.updateLocation);
// // delete location route
router.delete("/locations/:id", locationController_1.deleteLocation);
// // test routes
router.post("/test", filesystems_1.default.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "otherImages", maxCount: 5 },
]), (req, res) => {
    const data = req.body;
    console.log(data);
    res.status(200).json({
        data: data,
        success: true,
        message: "category deleted successfully",
    });
});
// categories
router.get("/categories", async (req, res) => {
    const categories = await db_1.default.category.findMany();
    res.status(200).json({
        success: true,
        data: categories,
    });
});
const categorySlugSchema = zod_1.z.object({
    categorySlug: zod_1.z
        .string()
        .min(3)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Invalid slug format (use lowercase letters, numbers, and hyphens)")
        .transform((val) => val.toLowerCase()),
});
const paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
});
router.get("/categories/:categorySlug/listings", async (req, res) => {
    try {
        const { categorySlug } = categorySlugSchema.parse(req.params);
        const { page, limit } = paginationSchema.parse(req.query);
        // Check if category exists
        const category = await db_1.default.category.findUnique({
            where: { slug: categorySlug },
            select: { id: true, name: true, slug: true },
        });
        if (!category) {
            res.status(404).json({
                success: false,
                message: `Category '${categorySlug}' not found`,
            });
            return;
        }
        // Get paginated listings
        const [listings, totalCount] = await Promise.all([
            db_1.default.listing.findMany({
                where: { categoryId: category.id },
                include: {
                    category: {
                        select: { name: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            db_1.default.listing.count({
                where: { categoryId: category.id },
            }),
        ]);
        // Format response
        const responseData = {
            category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
            },
            listings: listings,
            pagination: {
                totalItems: totalCount,
                currentPage: page,
                pageSize: limit,
                totalPages: Math.ceil(totalCount / limit),
            },
        };
        res.status(200).json({
            success: true,
            data: responseData,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                errors: error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }
        console.error("Error fetching listings:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
// src/schemas/listings.schema.ts
exports.listingIdSchema = zod_1.z.object({
    listingId: zod_1.z.coerce.number().int().positive(),
});
// src/routes/listings.routes.ts
router.get("/listings/:listingId", async (req, res) => {
    try {
        const { listingId } = exports.listingIdSchema.parse(req.params);
        const listing = await db_1.default.listing.findUnique({
            where: { id: listingId },
            include: {
                category: {
                    select: { id: true, name: true, slug: true },
                },
                location: true,
                images: {
                    orderBy: { order: "asc" },
                    select: { url: true, alt: true, isMain: true },
                },
                WorkingHour: {
                    select: { day: true, openTime: true, closeTime: true },
                },
            },
        });
        if (!listing) {
            res.status(404).json({
                success: false,
                message: "Listing not found",
            });
            return;
        }
        // Remove sensitive fields
        // const { email, phone, ...safeListing } = listing;
        res.status(200).json({
            success: true,
            data: {
                ...listing,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                errors: error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }
        console.error("Error fetching listing:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
exports.default = router;
