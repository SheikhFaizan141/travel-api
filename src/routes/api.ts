import express, { Request, Response } from "express";
import upload from "../config/filesystems";
import adminRoutes from "./adminRoutes";
import prisma from "../config/db";
import {
  getCategoryFeatures,
  getCategoryListings,
} from "../controllers/categoryContoller";
import {
  getListingBySlug,
  getListingDetails,
} from "../controllers/listingController";
import { getLocationBySlug } from "../controllers/locationController";

const router = express.Router();

// router.use("/", clientRoutes);

router.use("/admin", adminRoutes);

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

router.get("/categories/:categorySlug/listings", getCategoryListings);

router.get("/listings/:listingId", getListingDetails);

// lisings by slug
router.get("/listings/slug/:slug", getListingBySlug);

router.get("/categories/:id/features", getCategoryFeatures);

// location
router.get("/locations/:slug/listings", getLocationBySlug);

router.get("/locations/options", async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error("Error fetching locations options:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// get reviews for a listing
// router.get("/listings/:listingId/reviews", );

// add review
// router.post("/listings/:listingId/reviews", addReview);

export default router;
