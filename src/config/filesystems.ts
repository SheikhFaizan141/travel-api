import { mkdir } from "fs/promises";
import multer from "multer";
import path from "path";
import sanitize from "sanitize-filename";

interface ErrorWithCode extends Error {
  code?: string;
}

// Configure storage
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = process.env.UPLOAD_DIR || "uploads";

    try {
      await mkdir(uploadDir, {
        recursive: true,
      });

      cb(null, uploadDir);
    } catch (err) {
      // Enhanced error logging
      console.error(`Failed to create upload directory: ${uploadDir}`, err);

      // Convert to Multer-compatible error
      const error: ErrorWithCode = new Error(
        "Failed to create upload directory"
      );
      error.code = "UPLOAD_DIR_CREATION_FAILED";

      cb(error, "");
    }
  },
  filename: function (req, file, cb) {
    // Split filename and extension

    // console.log("file", file);
    
    // Sanitize filename
    const sanitizedName = sanitize(file.originalname, { replacement: "_" });

    // console.log("sanitizedName", sanitizedName);

    // Add timestamp to filename to avoid conflicts
    const timestamp = Date.now();
    const filename = `${timestamp}-${sanitizedName}`;

    cb(null, filename);
  },
});

// Initialize Multer
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Whitelist allowed file types (e.g., images and videos)
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    // file extension
    const fileExtension = path.extname(file.originalname);

    if (
      allowedTypes.includes(file.mimetype) &&
      allowedExtensions.includes(fileExtension)
    ) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

export default upload;
