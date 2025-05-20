"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListingDetails = exports.listingIdSchema = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../config/db"));
exports.listingIdSchema = zod_1.z.object({
    listingId: zod_1.z.coerce.number().int().positive(),
});
const getListingDetails = async (req, res) => {
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
};
exports.getListingDetails = getListingDetails;
