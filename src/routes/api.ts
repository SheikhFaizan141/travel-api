import express, { Request, Response } from "express";
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
import { getCategoryListings } from "../controllers/categoryContoller";
import { getListingBySlug, getListingDetails } from "../controllers/listingController";
import { slugSchema } from "../schemas/schemas";
// import validate from "../middleware/validationMiddleware";
// import { UpdateListingSchema } from "../schemas/schemas.js";

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

router.get("/categories/:categorySlug/listings", getCategoryListings);

router.get("/listings/:listingId", getListingDetails);

// lisings by slug
router.get("/listings/slug/:slug", getListingBySlug);

export default router;
