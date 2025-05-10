import express from "express";
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
// import validate from "../middleware/validationMiddleware";
// import { UpdateListingSchema } from "../schemas/schemas.js";
// import multer from "multer";

const router = express.Router();

// router.use("/", clientRoutes);

// get listings route
// router.get("/listings", getListings);

// create listing route
// router.post(
//   "/listings",
//   upload.fields([
//     { name: "featuredImage", maxCount: 1 },
//     { name: "otherImages", maxCount: 5 },
//   ]),
//   createListing
// );

// // update listing route
router.patch(
  "/listings/:id",
  upload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "otherImages", maxCount: 5 },
  ]),
  updateListing
);

// // delete listing route
router.delete("/listings/:id", deleteListing);

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

export default router;
