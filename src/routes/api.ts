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
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/admin/categoryController";
import clientRoutes from "./clientRoutes";
// import validate from "../middleware/validationMiddleware";
// import { UpdateListingSchema } from "../schemas/schemas.js";
// import multer from "multer";

const router = express.Router();

// router.use("/", clientRoutes);

// get listings route
router.get("/listings", getListings);

// get listing route
router.get("/listings/:id", getListing);

// create listing route
router.post(
  "/listings",
  upload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "otherImages", maxCount: 5 },
  ]),
  createListing
);

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

// // category routes here
router.get("/categories", getCategories);

// router.get("/categories/:id");

router.post("/categories", createCategory);

router.patch("/categories", updateCategory);

router.delete("/categories/:id", deleteCategory);

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

export default router;
