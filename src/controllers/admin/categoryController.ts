import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../config/db";
import { Prisma } from "@prisma/client";
import { IdSchema, UpdateLocationSchema } from "../../schemas/schemas";
import { CategorySchema } from "../../schemas/category-schemas";

const CategoryParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export const getCategories = async (req: Request, res: Response) => {
  try {
    // validate the query parameters for page and limit
    const { page = 1, limit = 10 } = CategoryParamsSchema.parse(req.query);

    const [categories, totalItems] = await Promise.all([
      prisma.category.findMany({
        take: limit,
        skip: limit * (page - 1),
        orderBy: {
          createdAt: "desc", 
        },
        include: {
          features: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.category.count(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching listing:", error);

    // Handle validation errors
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

export const getCategory = async (req: Request, res: Response) => {
  try {
    const { id } = IdSchema.parse(req.params);

    const category = await prisma.category.findUniqueOrThrow({
      where: {
        id: id,
      },
      include: {
        features: true,
      },
    });

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching location:", error);

    // Handle not found error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({
          success: false,
          error: "category not found",
        });
        return;
      }
    }

    // Handle other errors
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const validatedData = CategorySchema.parse(req.body);

    const existingCategory = await prisma.category.findUnique({
      where: {
        slug: validatedData.slug,
      },
    });

    if (existingCategory) {
      res.status(400).json({
        success: false,
        error: "Slug already exists",
        details: [
          {
            field: "slug",
            message: "Slug already exists for another category.",
          },
        ],
      });
      return;
    }

    // Validate features exist if provided
    if (validatedData.featureIds && validatedData.featureIds.length > 0) {
      const existingFeatures = await prisma.feature.findMany({
        where: {
          id: {
            in: validatedData.featureIds,
          },
        },
        select: {
          id: true,
        },
      });

      const missingFeatures = validatedData.featureIds.filter((featureId) => {
        const featureExists = existingFeatures.some(
          (feature) => feature.id === featureId
        );
        return !featureExists;
      });

      if (missingFeatures.length > 0) {
        res.status(400).json({
          success: false,
          error: "Some features do not exist",
          details: missingFeatures.map((id) => ({
            field: "featureIds",
            message: `Feature with ID ${id} does not exist.`,
          })),
        });
        return;
      }

      // # ------------------ WORK HERE NEXT TIME ------------------
    }

    // Check if the banner image is provided and set the image URL
    let fileUrl = "";
    if (req.file) {
      const baseUrl = process.env.BASE_URL; // Replace with your server's base URL
      fileUrl = `${baseUrl}/${req.file.path.replace(/\\/g, "/")}`;
    }

    // create the category
    const newCategory = await prisma.category.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        icon: validatedData.icon,
        bannerImage: fileUrl,
        features: {
          connect: validatedData.featureIds.map((id) => ({ id })),
        },
      },
      include: {
        features: true, // Include features if needed
      },
    });

    res.status(201).json({
      success: true,
      message: "category created successfully",
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

    // Handle other errors
    res.status(500).json({ error: "Internal server error", details: error });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = IdSchema.parse(req.params);

    const validatedData = UpdateLocationSchema.parse(req.body);

    const existing = await prisma.category.findFirst({
      where: {
        slug: validatedData.slug,
        NOT: { id: id },
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: { message: "Slug already exists for another category." },
      });
      return;
    }

    await prisma.category.findUniqueOrThrow({
      where: {
        id: id,
      },
    });

    // Update the category
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
    await prisma.category.findUniqueOrThrow({ where: { id } });

    await prisma.category.delete({
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
