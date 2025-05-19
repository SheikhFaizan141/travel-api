"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const refreshAccessToken = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    const generateAccessToken = (userId) => { };
    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const userId = decoded.userId;
        const user = await db_1.default.user.findUnique({
            where: { id: userId, refreshToken },
        });
        if (!user) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        const newAccessToken = generateAccessToken(userId);
        res.setHeader("Authorization", `Bearer ${newAccessToken}`);
        req.userId = userId;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }
};
exports.refreshAccessToken = refreshAccessToken;
