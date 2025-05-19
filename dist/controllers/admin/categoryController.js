"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategory = exports.getCategories = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../config/db"));
const client_1 = require("@prisma/client");
const schemas_1 = require("../../schemas/schemas");
const CategoryParamsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(500).optional(),
});
const getCategories = async (req, res) => {
    try {
        // validate the query parameters for page and limit
        const { page = 1, limit = 10 } = CategoryParamsSchema.parse(req.query);
        const [categories, totalItems] = await Promise.all([
            db_1.default.category.findMany({
                take: limit,
                skip: limit * (page - 1),
                orderBy: {
                    createdAt: "desc",
                },
            }),
            db_1.default.category.count(),
        ]);
        const totalPages = Math.ceil(totalItems / limit);
        res.status(200).json({
            success: true,
            data: categories,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    }
    catch (error) {
        console.error("Error fetching listing:", error);
        // Handle validation errors
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: "validation error",
                details: error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: "validation error",
                details: error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }
        // Handle other errors
        res.status(500).json({
            error: "Internal server error",
            details: error,
        });
    }
};
exports.getCategories = getCategories;
const getCategory = async (req, res) => {
    try {
        const { id } = schemas_1.IdSchema.parse(req.params);
        const category = await db_1.default.category.findUniqueOrThrow({
            where: {
                id: id,
            },
        });
        res.json({
            success: true,
            data: category,
        });
    }
    catch (error) {
        console.error("Error fetching location:", error);
        // Handle not found error
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(404).json({
                    success: false,
                    error: "category not found",
                });
                return;
            }
        }
        // Handle other errors
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getCategory = getCategory;
const createCategory = async (req, res) => {
    try {
        const validatedData = schemas_1.CategorySchema.parse(req.body);
        const existingCategory = await db_1.default.category.findUnique({
            where: {
                slug: validatedData.slug,
            },
        });
        if (existingCategory) {
            res.status(400).json({
                success: false,
                error: "Slug already exists",
                details: [
                    {
                        field: "slug",
                        message: "Slug already exists for another category.",
                    },
                ],
            });
            return;
        }
        // Check if the banner image is provided and set the image URL
        let fileUrl = "";
        if (req.file) {
            const baseUrl = process.env.BASE_URL; // Replace with your server's base URL
            fileUrl = `${baseUrl}/${req.file.path.replace(/\\/g, "/")}`;
        }
        // create the category
        const newCategory = await db_1.default.category.create({
            data: {
                ...validatedData,
                banner_image: fileUrl,
            },
        });
        res.status(201).json({
            success: true,
            message: "category created successfully",
            data: newCategory,
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
        // Handle other errors
        res.status(500).json({ error: "Internal server error", details: error });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const { id } = schemas_1.IdSchema.parse(req.params);
        const validatedData = schemas_1.UpdateLocationSchema.parse(req.body);
        const existing = await db_1.default.category.findFirst({
            where: {
                slug: validatedData.slug,
                NOT: { id: id },
            },
        });
        if (existing) {
            res.status(400).json({
                success: false,
                error: { message: "Slug already exists for another category." },
            });
            return;
        }
        await db_1.default.category.findUniqueOrThrow({
            where: {
                id: id,
            },
        });
        // Update the category
        const updatedCategory = await db_1.default.category.update({
            where: {
                id: id,
            },
            data: validatedData,
        });
        res.status(200).json({
            success: true,
            message: "Location updated successfully a",
            data: updatedCategory,
        });
    }
    catch (error) {
        console.error("Error updating location", error);
        // Handle not found error
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(404).json({
                    success: false,
                    error: "Location not found",
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
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = schemas_1.IdSchema.parse(req.params);
        // Verify existence first
        await db_1.default.category.findUniqueOrThrow({ where: { id } });
        await db_1.default.category.delete({
            where: {
                id: id,
            },
        });
        res.status(200).json({
            success: true,
            message: "category deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting listing:", error);
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
        // Handle not found error
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(404).json({
                    success: false,
                    error: "Location not found",
                });
                return;
            }
        }
        // Handle other errors
        res.status(500).json({
            error: "Internal server error",
            details: error,
        });
    }
};
exports.deleteCategory = deleteCategory;
