import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";

const reviewSchema = z.object({
  listingId: z.number().int().positive("Listing ID must be a positive integer"),
  comment: z
    .string()
    .min(3, "Comment must be at least 3 characters long")
    .max(500, "Comment must not exceed 500 characters"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
});

export async function addReview(req: Request, res: Response) {
  try {
    const { listingId, rating, comment } = reviewSchema.parse(req.body);

    const listing = await prisma.listing.findUniqueOrThrow({
      where: {
        id: listingId,
      },
    });

    // Check if the listing exists
    if (!listing) {
      res.status(404).json({
        success: false,
        message: "Listing not found",
      });

      return;
    }

    // check if the user has already reviewed this listing
    const existingReview = await prisma.review.findFirst({
      where: {
        listingId: listing.id,
        userId: req.user?.id,
      },
    });

    if (existingReview) {
      res.status(400).json({
        success: false,
        message: "You have already reviewed this listing",
      });
      return;
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        listingId: listing.id,
        content: comment,
        rating: rating,
        userId: req.user?.id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Review added successfully",
    });

    // Validate input data
  } catch (error) {
    console.error("Error adding review:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "An error occurred while adding the review",
      error: error,
    });
  }
}
