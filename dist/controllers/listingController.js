"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListing = exports.updateListing = exports.createListing = exports.getListing = exports.getListings = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const schemas_1 = require("../utils/schemas");
const schemas_2 = require("../schemas/schemas");
const client_1 = require("@prisma/client");
const paginationSchema = zod_1.z
    .object({
    page: zod_1.z.string().optional().default("1").transform(Number),
    limit: zod_1.z.string().optional().default("10").transform(Number),
})
    .transform(({ page, limit }) => ({
    page: Math.max(1, page),
    limit: Math.max(1, Math.min(100, limit)),
}));
const getListings = async (req, res) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const skip = (page - 1) * limit;
        const [listings, total] = await Promise.all([
            db_1.default.listing.findMany({
                skip,
                take: limit,
                include: { category: true },
            }),
            db_1.default.listing.count(),
        ]);
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            success: true,
            data: {
                listings,
                currentPage: page,
                totalPages,
                totalListings: total,
                limit,
            },
        });
    }
    catch (error) {
        console.error("Error fetching listing:", error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: "Invalid query parameters",
                details: error.errors,
            });
            return;
        }
        // Handle other errors
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getListings = getListings;
const getListing = async (req, res) => {
    try {
        const { id } = schemas_1.IdSchema.parse(req.params);
        const listing = await db_1.default.listing.findUnique({
            where: {
                id: id,
            },
            include: {
                WorkingHour: true,
                category: true,
            },
        });
        if (!listing) {
            res.status(404).json({
                success: false,
                error: "listing not found",
            });
            return;
        }
        res.json({
            success: true,
            data: listing,
        });
    }
    catch (error) {
        console.error("Error fetching listing:", error);
        // Handle validation errors
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getListing = getListing;
const createListing = async (req, res) => {
    const uploadedFiles = []; // Track all uploaded files
    try {
        if (!process.env.BASE_URL) {
            throw new Error("BASE_URL environment variable is not configured");
        }
        const listingData = req.body;
        // Safely parse working hours if they exist
        const workingHours = req.body.workingHours
            ? JSON.parse(req.body.workingHours)
            : undefined;
        // Validate with optional working hours
        const validatedData = schemas_2.ListingSchema.parse({
            ...listingData,
            workingHours: workingHours,
        });
        const files = req.files;
        const createdListing = await db_1.default.$transaction(async (tx) => {
            await tx.category.findUniqueOrThrow({
                where: { id: validatedData.categoryId },
            });
            const { workingHours, ...rest } = validatedData;
            const newListing = await tx.listing.create({
                data: {
                    ...rest,
                    WorkingHour: validatedData.workingHours
                        ? {
                            createMany: {
                                data: validatedData.workingHours.map((wh) => ({
                                    day: wh.day,
                                    is24Hour: wh.is24Hour,
                                    openTime: wh.openingTime,
                                    closeTime: wh.closingTime,
                                })),
                            },
                        }
                        : undefined,
                },
                include: {
                    WorkingHour: true,
                },
            });
            if (files?.length) {
                const featureImage = files.find((f) => f.fieldname === "featuredImage");
                if (featureImage) {
                    uploadedFiles.push(featureImage.path);
                    await tx.listingImage.create({
                        data: {
                            url: `${process.env.BASE_URL}/${featureImage.path.replace(/\\/g, "/")}`,
                            isMain: true,
                            order: 0,
                            listingId: newListing.id,
                        },
                    });
                }
            }
            return newListing;
        });
        res.status(201).json({
            success: true,
            data: createdListing,
        });
    }
    catch (error) {
        console.error("Error updating listing:", error);
        // Handle validation errors
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }
        // Cleanup files if any error occurs
        if (uploadedFiles.length > 0) {
            await Promise.all(uploadedFiles.map(async (filePath) => {
                try {
                    await fs_1.default.promises.unlink(filePath);
                    // Cleanup directory if empty
                    const dir = path_1.default.dirname(filePath);
                    const filesInDir = await fs_1.default.promises.readdir(dir);
                    if (filesInDir.length === 0) {
                        await fs_1.default.promises.rmdir(dir);
                    }
                }
                catch (err) {
                    console.error(`Failed to cleanup file ${filePath}:`, err);
                }
            }));
        }
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
                res.status(400).json({
                    success: false,
                    error: "Invalid category ID: Category does not exist",
                });
                return;
            }
        }
        // Handle other errors
        res.status(500).json({ error: "Internal server error a", details: error });
    }
};
exports.createListing = createListing;
const updateListing = async (req, res) => {
    try {
        const { id } = schemas_1.IdSchema.parse(req.params);
        // Verify existence first
        await db_1.default.listing.findUniqueOrThrow({
            where: {
                id: id,
            },
        });
        const listingData = req.body;
        // Safely parse working hours if they exist
        const workingHours = req.body.workingHours
            ? JSON.parse(req.body.workingHours)
            : undefined;
        // Validate with optional working hours
        const validatedData = schemas_2.ListingSchema.parse({
            ...listingData,
            workingHours: workingHours,
        });
        const updatedListing = await db_1.default.listing.update({
            where: {
                id: id,
            },
            data: validatedData,
        });
        res.status(200).json({
            success: true,
            message: "listing updated successfully",
            data: updatedListing,
        });
    }
    catch (error) {
        console.error("Error updating listing:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(404).json({
                    success: false,
                    error: "Listing not found",
                });
                return;
            }
        }
        // Handle validation errors
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }
        // Handle other errors
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateListing = updateListing;
const deleteListing = async (req, res) => {
    try {
        const { id } = schemas_1.IdSchema.parse(req.params);
        // Verify existence first
        const existingListing = await db_1.default.listing.findUnique({ where: { id } });
        if (!existingListing) {
            res.status(404).json({
                success: false,
                error: "Listing not found",
            });
            return;
        }
        await db_1.default.listing.delete({
            where: {
                id: id,
            },
        });
        res.status(200).json({ message: "listing deleted" });
    }
    catch (error) {
        console.error("Error deleting listing:", error);
        // Handle other errors
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.deleteListing = deleteListing;
