// import express, { Request, Response } from "express";
// import prisma from "../config/db";

// const listingRoutes = express.Router();

// enum ListingType {
//   HOTEL = "hotel",
//   HOUSEBOAT = "houseboat",
//   HUT = "hut",
// }

// // get listings route
// listingRoutes.get("/listings", async (req: Request, res: Response) => {
//   const { type } = req.query;
//   if (type) {
//   }
//   const listings = await prisma.listing.findMany();

//   res.json(listings);
// });

// // get single listing route
// listingRoutes.get("/listings:listingId", (req, res) => {
//   const userId = req.params.listingId;
//   // Now you have access to userId
//   res.send(`User ID is ${userId}`);
// });

// listingRoutes.post("/listing", (req, res) => {
//   console.log("Logout route hit");
//   res.send("Logout route");
// });

// export default listingRoutes;
