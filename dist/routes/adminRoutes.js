"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const locationController_1 = require("../controllers/admin/locationController");
const filesystems_1 = __importDefault(require("../config/filesystems"));
const categoryController_1 = require("../controllers/admin/categoryController");
const listingController_1 = require("../controllers/listingController");
const router = express_1.default.Router();
// get listings route
router.get("/listings", listingController_1.getListings);
// get listing route
router.get("/listings/:id", listingController_1.getListing);
// create listing route
router.post("/listings", filesystems_1.default.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "otherImages", maxCount: 5 },
]), listingController_1.createListing);
// // update listing route
router.put("/listings/:id", filesystems_1.default.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "otherImages", maxCount: 5 },
]), listingController_1.updateListing);
// delete listing route
router.delete("/listings/:id", listingController_1.deleteListing);
// location routes here
router.get("/locations", locationController_1.getLocations);
// // get location route
router.get("/locations/:id", locationController_1.getLocation);
// // create location route
router.post("/locations", filesystems_1.default.single("featured_image"), locationController_1.createLocation);
// // update location route
router.patch("/locations/:id", filesystems_1.default.single("featured_image"), locationController_1.updateLocation);
// // delete location route
router.delete("/locations/:id", locationController_1.deleteLocation);
// // category routes here
router.get("/categories", categoryController_1.getCategories);
router.get("/categories/:id", categoryController_1.getCategory);
router.post("/categories", filesystems_1.default.single("banner_image"), categoryController_1.createCategory);
router.patch("/categories/:id", filesystems_1.default.single("banner_image"), categoryController_1.updateCategory);
router.delete("/categories/:id", categoryController_1.deleteCategory);
exports.default = router;
