"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clientController_js_1 = require("../controllers/client/clientController.js");
const router = express_1.default.Router();
// Home Page Content
router.get("/home", clientController_js_1.getHomeContent);
exports.default = router;
