"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const refreshAccessToken_1 = require("./refreshAccessToken");
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const verifyAccessToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json({ message: "Access token is required" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(accessToken, ACCESS_TOKEN_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return (0, refreshAccessToken_1.refreshAccessToken)(req, res, next);
        }
        return res.status(403).json({ message: "Invalid access token" });
    }
};
exports.verifyAccessToken = verifyAccessToken;
