import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";
import { IdSchema } from "../schemas/schemas";

const categorySlugSchema = z.object({
  categorySlug: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Invalid slug format (use lowercase letters, numbers, and hyphens)"
    )
    .transform((val) => val.toLowerCase()),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(99),
});

export const getCategoryListings = async (req: Request, res: Response) => {
  try {
    const { categorySlug } = categorySlugSchema.parse(req.params);
    const { page, limit } = paginationSchema.parse(req.query);

    // get query parameters
    const { features } = req.query;

    console.log("Query parameters:", req.query);
    res.status(200).json({
      success: true,
      message: "Query parameters received",
      data: {
        categorySlug,
        features,
      }
    });

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true, name: true, slug: true },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: `Category '${categorySlug}' not found`,
      });
      return;
    }

    // Get paginated listings
    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where: { categoryId: category.id },
        include: {
          category: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({
        where: { categoryId: category.id },
      }),
    ]);

    // Format response
    const responseData = {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },

      listings: listings,

      pagination: {
        totalItems: totalCount,
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
      return;
    }

    console.error("Error fetching listings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCategoryFeatures = async (req: Request, res: Response) => {
  try {
    const { id } = IdSchema.parse(req.params);

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        features: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category.features,
    });
  } catch (error) {
    console.error("Error fetching category features:", error);

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

    res.status(500).json({ error: "Internal server error" });
  }
};
