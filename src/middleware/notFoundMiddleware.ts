import { Request, Response, NextFunction } from "express";

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
    error: {
      code: 404,
      description: "The requested resource was not found on this server",
    },
  });
};
