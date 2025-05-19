"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    // Default status code is 500 (Internal Server Error)
    const status = err.status || 500;
    // Default error message
    const message = err.message || "Internal Server Error";
    // Log the error (optional, for debugging purposes)
    console.error(`[Error] ${status}: ${message}`);
    // Send the error response
    res.status(status).json({
        error: {
            message,
            details: err.details || null, // Include additional error details if available
        },
    });
    // Call the next middleware
    next();
};
exports.errorHandler = errorHandler;
