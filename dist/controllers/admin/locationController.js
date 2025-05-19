"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocation = exports.updateLocation = exports.createLocation = exports.getLocation = exports.getLocations = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../config/db"));
const client_1 = require("@prisma/client");
const schemas_1 = require("../../schemas/schemas");
const IdSchema = zod_1.z.object({
    id: zod_1.z.preprocess((val) => {
        return typeof val === "string" ? Number.parseInt(val, 10) : val;
    }, zod_1.z.number().int().positive()),
});
const LocationsParamsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(500).optional(),
});
const getLocations = async (req, res) => {
    try {
        // validate the query parameters for page and limit
        const { page = 1, limit = 10 } = LocationsParamsSchema.parse(req.query);
        const [locations, totalItems] = await Promise.all([
            db_1.default.location.findMany({
                take: limit,
                skip: limit * (page - 1),
            }),
            db_1.default.location.count(),
        ]);
        const totalPages = Math.ceil(totalItems / limit);
        res.status(200).json({
            data: locations,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    }
    catch (error) {
        console.error("Error fetching listing:", error);
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
exports.getLocations = getLocations;
const getLocation = async (req, res) => {
    try {
        const { id } = IdSchema.parse(req.params);
        const location = await db_1.default.location.findUnique({
            where: {
                id: id,
            },
        });
        if (!location) {
            res.status(404).json({ error: "location not found" });
            return;
        }
        res.json({
            data: location,
        });
    }
    catch (error) {
        console.error("Error fetching location:", error);
        // Handle other errors
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getLocation = getLocation;
const createLocation = async (req, res) => {
    try {
        const validatedData = schemas_1.LocationSchema.parse(req.body);
        const featuredImage = req.file;
        let fileUrl = "";
        if (featuredImage) {
            // Generate the file URL
            const baseUrl = process.env.BASE_URL; // Replace with your server's base URL
            fileUrl = `${baseUrl}/${featuredImage.path.replace(/\\/g, "/")}`;
        }
        const newLocation = await db_1.default.location.create({
            data: {
                ...validatedData,
                featured_image: fileUrl,
            },
        });
        res.status(201).json({
            success: true,
            message: "Location created",
            data: newLocation,
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
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // The .code property can be accessed in a type-safe manner
            if (error.code === "P2002") {
                console.log("There is a unique constraint violation, a new user cannot be created with this email");
            }
        }
        // Handle other errors
        res.status(500).json({ error: "Internal server error", details: error });
    }
};
exports.createLocation = createLocation;
const updateLocation = async (req, res) => {
    try {
        const { id } = IdSchema.parse(req.params);
        const validatedData = schemas_1.UpdateLocationSchema.parse(req.body);
        await db_1.default.location.findUniqueOrThrow({
            where: {
                id: id,
            },
        });
        let updateData = {
            ...validatedData,
            // featured_image: location.featured_image ?? "", // Keep the old image if not provided
        };
        // Handle file upload
        if (req.file) {
            // unlink the old image (if any)
            // if(location.featured_image) {
            //   const oldImagePath = location.featured_image.replace(`${process.env.BASE_URL}/`, "");
            //   fs.unlink(oldImagePath, (err) => {
            //     if (err) {
            //       console.error("Error deleting old image", err);
            //     }
            //   });
            // }
            const featuredImage = req.file;
            const baseUrl = process.env.BASE_URL;
            const fileUrl = `${baseUrl}/${featuredImage.path.replace(/\\/g, "/")}`;
            // res.status(200).json({
            //   baseUrl: baseUrl,
            //   fileUrl: fileUrl,
            //   featuredImage: featuredImage,
            // })
            // Update the listing with the new image
            updateData = {
                ...updateData,
                featured_image: fileUrl,
            };
        }
        // Update the listing
        const updatedLocation = await db_1.default.location.update({
            where: {
                id: id,
            },
            data: updateData,
        });
        res.status(200).json({
            success: true,
            message: "Location updated successfully a",
            data: updatedLocation,
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
exports.updateLocation = updateLocation;
const deleteLocation = async (req, res) => {
    try {
        const { id } = IdSchema.parse(req.params);
        // Verify existence first
        await db_1.default.location.findUniqueOrThrow({ where: { id } });
        await db_1.default.location.delete({
            where: {
                id: id,
            },
        });
        res.status(200).json({
            success: true,
            message: "location deleted successfully",
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
exports.deleteLocation = deleteLocation;
