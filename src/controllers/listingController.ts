import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";

export const listingIdSchema = z.object({
  listingId: z.coerce.number().int().positive(),
});

export const getListingDetails = async (req: Request, res: Response) => {
  try {
    const { listingId } = listingIdSchema.parse(req.params);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        location: true,
        images: {
          orderBy: { order: "asc" },
          select: { url: true, alt: true, isMain: true },
        },
        WorkingHour: {
          select: { day: true, openTime: true, closeTime: true },
        },
      },
    });

    if (!listing) {
      res.status(404).json({
        success: false,
        message: "Listing not found",
      });

      return;
    }

    // Remove sensitive fields
    // const { email, phone, ...safeListing } = listing;

    res.status(200).json({
      success: true,
      data: {
        ...listing,
      },
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

    console.error("Error fetching listing:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
