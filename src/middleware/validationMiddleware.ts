import { NextFunction, Request, Response } from "express";
import { AnyZodObject, z } from "zod";

const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next(); // If validation passes, call the next middleware
    } catch (error) {
      console.error("Error validating request:", error);

      if (error instanceof z.ZodError) {
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

export default validate;
