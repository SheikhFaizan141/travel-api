"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeContent = void 0;
const db_js_1 = __importDefault(require("../../config/db.js"));
// import { z } from "zod";
// Zod Schemas for Input Validation
// const LocationFiltersSchema = z.object({
//   category: z.string().optional(),
//   minRating: z.number().min(0).max(5).optional(),
//   priceRange: z.tuple([z.number(), z.number()]).optional(),
//   page: z.number().min(1).default(1),
//   limit: z.number().min(1).max(100).default(20),
// });
const getHomeContent = async (req, res) => {
    try {
        // Fetch home page content
        const [featured, categories, popular] = await Promise.all([
            db_js_1.default.location.findMany({
                take: 8,
            }),
            db_js_1.default.category.findMany({
                where: {
                    name: {
                        in: ["Hut", "Hotels", "Apartments", "Restaurants"],
                    },
                },
            }),
            db_js_1.default.location.findMany({
                take: 8,
            }),
        ]);
        res.json({
            success: true,
            data: {
                featuredListings: featured,
                popularLocations: popular,
                categories,
                testimonials: [
                    {
                        name: "John Doe",
                        location: "London, UK",
                        review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                    },
                    {
                        name: "Jane Doe",
                        location: "New York, USA",
                        review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                    },
                    {
                        name: "Alice",
                        location: "Paris, France",
                        review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                    },
                    {
                        name: "Bob",
                        location: "Berlin, Germany",
                        review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                    }
                ],
            },
        });
    }
    catch (error) {
        console.error("Error fetching home content:", error);
        // if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        //   if (error.code === "") {
        //   }
        // }
        // Send an error response
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getHomeContent = getHomeContent;
