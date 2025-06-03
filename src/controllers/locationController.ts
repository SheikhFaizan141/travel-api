import { Request, Response } from "express";
import prisma from "../config/db";
import { z } from "zod";

const slugSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(255, "Slug must not exceed 255 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    }),
});

const filterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

export async function getLocationBySlug(req: Request, res: Response) {
  try {
    const { slug } = slugSchema.parse(req.params);

    const { page, limit } = filterSchema.parse(req.query);

    const location = await prisma.location.findFirstOrThrow({
      where: { slug },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        listing: {
          include: {
            category: true,
            features: true,
            images: true,
            WorkingHour: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: (page - 1) * limit,
          take: limit,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("Error fetching locations by slug:", error);

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

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
