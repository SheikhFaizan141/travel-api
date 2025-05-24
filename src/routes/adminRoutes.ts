import express from "express";
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
  getCategory,
  updateCategory,
} from "../controllers/admin/categoryController";
import {
  createListing,
  deleteListing,
  getListing,
  getListings,
  updateListing,
} from "../controllers/admin/adminListingController";

const router = express.Router();

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
router.put(
  "/listings/:id",
  upload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "otherImages", maxCount: 5 },
  ]),
  updateListing
);

// delete listing route
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

router.get("/categories/:id", getCategory);

router.post("/categories", upload.single("banner_image"), createCategory);

router.patch("/categories/:id", upload.single("banner_image"), updateCategory);

router.delete("/categories/:id", deleteCategory);

export default router;
