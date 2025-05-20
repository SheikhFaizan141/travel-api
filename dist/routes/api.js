"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const locationController_1 = require("../controllers/admin/locationController");
const filesystems_1 = __importDefault(require("../config/filesystems"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const db_1 = __importDefault(require("../config/db"));
const categoryContoller_1 = require("../controllers/categoryContoller");
const listingController_1 = require("../controllers/listingController");
// import validate from "../middleware/validationMiddleware";
// import { UpdateListingSchema } from "../schemas/schemas.js";
const router = express_1.default.Router();
// router.use("/", clientRoutes);
router.use("/admin", adminRoutes_1.default);
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
// // test routes
router.post("/test", filesystems_1.default.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "otherImages", maxCount: 5 },
]), (req, res) => {
    const data = req.body;
    console.log(data);
    res.status(200).json({
        data: data,
        success: true,
        message: "category deleted successfully",
    });
});
// categories
router.get("/categories", async (req, res) => {
    const categories = await db_1.default.category.findMany();
    res.status(200).json({
        success: true,
        data: categories,
    });
});
router.get("/categories/:categorySlug/listings", categoryContoller_1.getCategoryListings);
// src/routes/listings.routes.ts
router.get("/listings/:listingId", listingController_1.getListingDetails);
exports.default = router;
