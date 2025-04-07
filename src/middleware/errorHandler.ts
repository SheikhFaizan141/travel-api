import { Request, Response, NextFunction } from "express";

// Define a custom error interface (optional but recommended for TypeScript)
interface HttpError extends Error {
  status?: number;
  details?: unknown;
}

export const errorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
