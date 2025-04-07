import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../config/db";
import { Prisma } from "@prisma/client";

const IdSchema = z.object({
  id: z.preprocess((val) => {
    return typeof val === "string" ? Number.parseInt(val, 10) : val;
  }, z.number().int().positive()),
});

const LocationsParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export const getCategories = async (req: Request, res: Response) => {
  try {
    // validate the query parameters for page and limit
    const { page = 1, limit = 10 } = LocationsParamsSchema.parse(req.query);

    const locations = await prisma.category.findMany({
      take: limit,
      skip: limit * (page - 1),
    });

    res.status(200).json({
      data: locations,
    });
  } catch (error) {
    console.error("Error fetching listing:", error);

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

export const getLocation = async (req: Request, res: Response) => {
  try {
    const { id } = IdSchema.parse(req.params);

    const location = await prisma.location.findUnique({
      where: {
        id: id,
      },
    });

    if (!location) {
      res.status(404).json({ error: "location not found" });
      return;
    }

    res.json({
      data: location,
    });
  } catch (error) {
    console.error("Error fetching location:", error);

    // Handle other errors
    res.status(500).json({ error: "Internal server error" });
  }
};

const CategorySchema = z.object({
  name: z.string().max(255),
});

export const createCategory = async (req: Request, res: Response) => {
  try {
    const validatedData = CategorySchema.parse(req.body);

    const newCategory = await prisma.category.create({
      data: validatedData,
    });

    res.status(201).json({
      success: true,
      message: "Location created",
      data: newCategory,
    });
  } catch (error) {
    console.error("Error updating listing:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });

      return;
    }

    // if (error instanceof Prisma.PrismaClientKnownRequestError) {
    //   if (error.code === "P2002") {
    //     res.status(400).json({
    //       success: false,
    //       error: "Category already exists",
    //     });
    //     return;
    //   }
    // }

    // Handle other errors
    res.status(500).json({ error: "Internal server error", details: error });
  }
};

// Schema for update validation
const UpdateCategorySchema = CategorySchema.extend({
  featured_image: z.string().optional(),
})
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for a PATCH request",
  });

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = IdSchema.parse(req.params);

    const validatedData = UpdateCategorySchema.parse(req.body);

    await prisma.category.findUniqueOrThrow({
      where: {
        id: id,
      },
    });

    // Update the listing
    const updatedCategory = await prisma.category.update({
      where: {
        id: id,
      },
      data: validatedData,
    });

    res.status(200).json({
      success: true,
      message: "Location updated successfully a",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating location", error);

    // Handle not found error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({
          success: false,
          error: "Location not found",
        });
        return;
      }
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });

      return;
    }

    // Handle other errors
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = IdSchema.parse(req.params);

    // Verify existence first
    await prisma.location.findUniqueOrThrow({ where: { id } });

    await prisma.location.delete({
      where: {
        id: id,
      },
    });

    res.status(200).json({
      success: true,
      message: "category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting listing:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
      return;
    }

    // Handle not found error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({
          success: false,
          error: "Location not found",
        });
        return;
      }
    }

    // Handle other errors
    res.status(500).json({
      error: "Internal server error",
      details: error,
    });
  }
};
