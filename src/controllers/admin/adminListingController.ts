import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../config/db";
import path from "path";
import fs from "fs";
import { IdSchema } from "../../utils/schemas";
import { ListingSchema, UpdateListingSchema } from "../../schemas/schemas";
import { Prisma, WorkingHour } from "@prisma/client";
import { generateSlug } from "../../utils/slug";

const paginationSchema = z
  .object({
    page: z.string().optional().default("1").transform(Number),
    limit: z.string().optional().default("10").transform(Number),
  })
  .transform(({ page, limit }) => ({
    page: Math.max(1, page),
    limit: Math.max(1, Math.min(100, limit)),
  }));

export const getListings = async (req: Request, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        skip,
        take: limit,
        include: { category: true },
      }),
      prisma.listing.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        listings,
        currentPage: page,
        totalPages,
        totalListings: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching listing:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: error.errors,
      });
      return;
    }

    // Handle other errors
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getListing = async (req: Request, res: Response) => {
  try {
    const { id } = IdSchema.parse(req.params);

    const listing = await prisma.listing.findUnique({
      where: {
        id: id,
      },
      include: {
        WorkingHour: true,
        category: true,
      },
    });

    if (!listing) {
      res.status(404).json({
        success: false,
        error: "listing not found",
      });
      return;
    }

    res.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error("Error fetching listing:", error);

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

    res.status(500).json({ error: "Internal server error" });
  }
};

export const createListing = async (req: Request, res: Response) => {
  const uploadedFiles: string[] = [];

  try {
    if (!process.env.BASE_URL) {
      throw new Error("BASE_URL environment variable is not configured");
    }

    const listingData = req.body;

    const { slug, error } = await generateSlug(prisma, {
      text: listingData.name,
      slug: listingData.slug, // optional custom slug
    });

    if (error) {
      res.status(409).json({
        success: false,
        error: "Validation Error",
        details: [{ field: "slug", message: error }],
      });

      return;
    }

    // Safely parse working hours if they exist
    const workingHours = (req.body.workingHours as WorkingHour)
      ? JSON.parse(req.body.workingHours)
      : undefined;

    // Validate with optional working hours
    const validatedData = ListingSchema.parse({
      ...listingData,
      workingHours: workingHours,
      faqs: req.body.faqs ? JSON.parse(req.body.faqs) : undefined,
    });

    const files = req.files as Express.Multer.File[];

    const createdListing = await prisma.$transaction(async (tx) => {
      await tx.category.findUniqueOrThrow({
        where: { id: validatedData.categoryId },
      });

      const { workingHours, faqs, ...rest } = validatedData;
      const newListing = await tx.listing.create({
        data: {
          ...rest,
          slug,
          WorkingHour: validatedData.workingHours
            ? {
                createMany: {
                  data: validatedData.workingHours.map((wh) => ({
                    day: wh.day,
                    is24Hour: wh.is24Hour,
                    openTime: wh.openingTime,
                    closeTime: wh.closingTime,
                  })),
                },
              }
            : undefined,
          faqs: faqs
            ? {
                create: faqs.map((faq) => ({
                  question: faq.question,
                  answer: faq.answer,
                })),
              }
            : undefined,
        },
        include: {
          WorkingHour: true,
          faqs: true
        },
      });

      if (files?.length) {
        const featureImage = files.find((f) => f.fieldname === "featuredImage");
        if (featureImage) {
          uploadedFiles.push(featureImage.path);
          await tx.listingImage.create({
            data: {
              url: `${process.env.BASE_URL}/${featureImage.path.replace(
                /\\/g,
                "/"
              )}`,
              isMain: true,
              order: 0,
              listingId: newListing.id,
            },
          });
        }
      }

      return newListing;
    });

    res.status(201).json({
      success: true,
      data: createdListing,
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

    // Cleanup files if any error occurs
    if (uploadedFiles.length > 0) {
      await Promise.all(
        uploadedFiles.map(async (filePath) => {
          try {
            await fs.promises.unlink(filePath);
            // Cleanup directory if empty
            const dir = path.dirname(filePath);
            const filesInDir = await fs.promises.readdir(dir);
            if (filesInDir.length === 0) {
              await fs.promises.rmdir(dir);
            }
          } catch (err) {
            console.error(`Failed to cleanup file ${filePath}:`, err);
          }
        })
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        res.status(400).json({
          success: false,
          error: "Invalid category ID: Category does not exist",
        });
        return;
      }
    }

    // Handle other errors
    res.status(500).json({ error: "Internal server error a", details: error });
  }
};

export const updateListing = async (req: Request, res: Response) => {
  try {
    const { id } = IdSchema.parse(req.params);

    // Verify existence first
    await prisma.listing.findUniqueOrThrow({
      where: {
        id: id,
      },
    });

    const listingData = req.body;

    // Safely parse working hours if they exist
    const workingHours = (req.body.workingHours as WorkingHour)
      ? JSON.parse(req.body.workingHours)
      : undefined;

    // Validate with optional working hours
    const validatedData = ListingSchema.parse({
      ...listingData,
      workingHours: workingHours,
    });

    // const updatedListing = await prisma.listing.update({
    //   where: {
    //     id: id,
    //   },
    //   data: validatedData,
    // });

    // res.status(200).json({
    //   success: true,
    //   message: "listing updated successfully",
    //   data: updatedListing,
    // });
  } catch (error) {
    console.error("Error updating listing:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({
          success: false,
          error: "Listing not found",
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

export const deleteListing = async (req: Request, res: Response) => {
  try {
    const { id } = IdSchema.parse(req.params);

    // Verify existence first
    const existingListing = await prisma.listing.findUnique({ where: { id } });

    if (!existingListing) {
      res.status(404).json({
        success: false,
        error: "Listing not found",
      });
      return;
    }

    await prisma.listing.delete({
      where: {
        id: id,
      },
    });

    res.status(200).json({ message: "listing deleted" });
  } catch (error) {
    console.error("Error deleting listing:", error);

    // Handle other errors
    res.status(500).json({ error: "Internal server error" });
  }
};
