"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../config/db"));
const listingRoutes = express_1.default.Router();
var ListingType;
(function (ListingType) {
    ListingType["HOTEL"] = "hotel";
    ListingType["HOUSEBOAT"] = "houseboat";
    ListingType["HUT"] = "hut";
})(ListingType || (ListingType = {}));
// get listings route
listingRoutes.get("/listings", async (req, res) => {
    const { type } = req.query;
    if (type) {
    }
    const listings = await db_1.default.listing.findMany();
    res.json(listings);
});
// get single listing route
listingRoutes.get("/listings:listingId", (req, res) => {
    const userId = req.params.listingId;
    // Now you have access to userId
    res.send(`User ID is ${userId}`);
});
listingRoutes.post("/listing", (req, res) => {
    console.log("Logout route hit");
    res.send("Logout route");
});
exports.default = listingRoutes;
