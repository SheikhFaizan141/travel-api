"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const schemas_1 = require("../utils/schemas");
const crypto_1 = __importDefault(require("crypto"));
const email_1 = require("../utils/email");
const router = express_1.default.Router();
// JWT Configuration
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
const generateAccessToken = (userId) => {
    const options = {
        expiresIn: (ACCESS_TOKEN_EXPIRES_IN || "15m"),
    };
    return jsonwebtoken_1.default.sign({ userId }, ACCESS_TOKEN_SECRET, options);
};
const generateRefreshToken = (userId) => {
    const options = {
        expiresIn: (REFRESH_TOKEN_EXPIRES_IN || "7d"),
    };
    return jsonwebtoken_1.default.sign({ userId }, REFRESH_TOKEN_SECRET, options);
};
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await db_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        const accessToken = generateAccessToken(newUser.id);
        const refreshToken = generateRefreshToken(newUser.id);
        await db_1.default.user.update({
            where: { id: newUser.id },
            data: { refreshToken },
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            sameSite: "strict",
        });
        res.status(201).json({ accessToken });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const { success } = schemas_1.loginSchema.safeParse(req.body);
        if (!success) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        const user = await db_1.default.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            res.status(404).json({
                message: "User not found",
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user?.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid credentials!" });
        }
        const accessToken = generateAccessToken(user?.id);
        const refreshToken = generateRefreshToken(user?.id);
        await db_1.default.user.update({
            where: { id: user?.id },
            data: { refreshToken },
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        res.status(200).json({ accessToken });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        // Find user
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ message: "No user found with this email." });
            return;
        }
        // Generate password reset token
        const resetToken = crypto_1.default.randomBytes(20).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        // Store reset token in database
        await db_1.default.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry },
        });
        // Send password reset email
        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
        await (0, email_1.sendPasswordResetEmail)(email, resetUrl);
        res.status(200).json({ message: "Password reset email sent", resetUrl });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Reset Password Route
router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        // Find user by reset token
        const user = await db_1.default.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }, // Check if token is not expired
            },
        });
        if (!user) {
            res.status(400).json({ message: "Invalid or expired token" });
            return;
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password and clear reset token
        await db_1.default.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        res.status(200).json({ message: "Password reset successful" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Logout Route
router.post("/logout", async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        // Clear refresh token from database
        if (refreshToken) {
            await db_1.default.user.updateMany({
                where: { refreshToken },
                data: { refreshToken: null },
            });
        }
        // Clear refresh token cookie
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;
