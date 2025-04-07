import express from "express";
import { getHomeContent } from "../controllers/client/clientController.js";

const router = express.Router();


// Home Page Content
router.get("/home", getHomeContent);


export default router;
