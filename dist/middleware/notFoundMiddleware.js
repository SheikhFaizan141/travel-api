"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = void 0;
const notFoundMiddleware = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Resource not found",
        error: {
            code: 404,
            description: "The requested resource was not found on this server",
        },
    });
};
exports.notFoundMiddleware = notFoundMiddleware;
