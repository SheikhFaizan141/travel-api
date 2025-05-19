"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next(); // If validation passes, call the next middleware
    }
    catch (error) {
        console.error("Error validating request:", error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: "validation error",
                details: error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }
        // Handle other errors
        res.status(500).json({
            error: "Internal server error",
            details: error,
        });
    }
};
exports.default = validate;
