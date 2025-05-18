import express, { Request, Response } from "express";
import {
  createListing,
  deleteListing,
  getListing,
  getListings,
  updateListing,
} from "../controllers/listingController";
import {
  createLocation,
  deleteLocation,
  getLocation,
  getLocations,
  updateLocation,
} from "../controllers/admin/locationController";
import upload from "../config/filesystems";
import adminRoutes from "./adminRoutes";
import prisma from "../config/db";
import { z } from "zod";
// import validate from "../middleware/validationMiddleware";
// import { UpdateListingSchema } from "../schemas/schemas.js";
// import multer from "multer";

const router = express.Router();

// router.use("/", clientRoutes);

router.use("/admin", adminRoutes);

// location routes here
router.get("/locations", getLocations);

// // get location route
router.get("/locations/:id", getLocation);

// // create location route
router.post("/locations", upload.single("featured_image"), createLocation);

// // update location route
router.patch("/locations/:id", upload.single("featured_image"), updateLocation);

// // delete location route
router.delete("/locations/:id", deleteLocation);

// // test routes
router.post(
  "/test",
  upload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "otherImages", maxCount: 5 },
  ]),
  (req, res) => {
    const data = req.body;

    console.log(data);

    res.status(200).json({
      data: data,
      success: true,
      message: "category deleted successfully",
    });
  }
);

// categories
router.get("/categories", async (req, res) => {
  const categories = await prisma.category.findMany();

  res.status(200).json({
    success: true,
    data: categories,
  });
});

const categorySlugSchema = z.object({
  categorySlug: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Invalid slug format (use lowercase letters, numbers, and hyphens)"
    )
    .transform((val) => val.toLowerCase()),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});


router.get("/listings/:categorySlug", async (req: Request, res: Response) => {
  try {
    const { categorySlug } = categorySlugSchema.parse(req.params);
    const { page, limit } = paginationSchema.parse(req.query);

    // Check if category exists
    const category = await prisma.category.findUnique({
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
      prisma.listing.findMany({
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
      prisma.listing.count({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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

export default router;
