"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = process.env.UPLOAD_DIR || "uploads";
        try {
            await (0, promises_1.mkdir)(uploadDir, {
                recursive: true,
            });
            cb(null, uploadDir);
        }
        catch (err) {
            // Enhanced error logging
            console.error(`Failed to create upload directory: ${uploadDir}`, err);
            // Convert to Multer-compatible error
            const error = new Error("Failed to create upload directory");
            error.code = "UPLOAD_DIR_CREATION_FAILED";
            cb(error, "");
        }
    },
    filename: function (req, file, cb) {
        // Split filename and extension
        // console.log("file", file);
        // Sanitize filename
        const sanitizedName = (0, sanitize_filename_1.default)(file.originalname, { replacement: "_" });
        // console.log("sanitizedName", sanitizedName);
        // Add timestamp to filename to avoid conflicts
        const timestamp = Date.now();
        const filename = `${timestamp}-${sanitizedName}`;
        cb(null, filename);
    },
});
// Initialize Multer
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Whitelist allowed file types (e.g., images and videos)
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
        // file extension
        const fileExtension = path_1.default.extname(file.originalname);
        if (allowedTypes.includes(file.mimetype) &&
            allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        }
        else {
            cb(new Error("File type not allowed"));
        }
    },
});
exports.default = upload;
