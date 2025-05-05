import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";
import path from "path";
import fs from "fs";
import { IdSchema } from "../utils/schemas";
import { ListingSchema, UpdateListingSchema } from "../schemas/schemas";
import { Prisma } from "@prisma/client";

export const getListings = async (req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        category: true,
      },
    });

    res.status(200).json({
      data: listings,
    });
  } catch (error) {
    console.error("Error fetching listing:", error);

    // Handle other errors
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate the ID
    const parsedId = Number.parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const listing = await prisma.listing.findUnique({
      where: {
        id: Number.parseInt(id, 10),
      },
    });

    if (!listing) {
      res.status(404).json({ error: "listing not found" });
      return;
    }

    console.log("Listing:", listing);
    

    res.json({
      data: listing,
    });
  } catch (error) {
    console.error("Error fetching listing:", error);

    // Handle other errors
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createListing = async (req: Request, res: Response) => {
  const uploadedFiles: string[] = []; // Track all uploaded files

  try {
    // Validate environment configuration first
    if (!process.env.BASE_URL) {
      throw new Error("BASE_URL environment variable is not configured");
    }

    const listingData = req.body;

    const validatedData = ListingSchema.parse(listingData);

    // Get Upload images files
    const files = req.files as Express.Multer.File[];

    // console.log("Files:", files);

    const createdListing = prisma.$transaction(async (tx) => {
      // Check if files are uploaded
      const newListing = await tx.listing.create({
        data: validatedData,
      });

      if (files && files.length > 0) {
        const featureImage = files.find(
          (file) => file.fieldname === "featuredImage"
        );

        if (featureImage) {
          const listingImage = prisma.listingImage.create({
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
    //   // The .code property can be accessed in a type-safe manner
    //   if (error.code === "P2002") {
    //     console.log(
    //       "There is a unique constraint violation, a new user cannot be created with this email"
    //     );
    //   }
    // }

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

    const listingData = JSON.parse(req.body.listing);
    const validatedData = UpdateListingSchema.parse(listingData);

    const files = req.files as Express.Multer.File[];
    const imagePaths =
      files?.map((file) => file.path.replace(/\\/g, "/")) || [];

    // skip image update if no new images are uploaded
    if (imagePaths.length > 0) {
      // Create transaction for atomic operations
      // await prisma.$transaction(async (tx) => {
      //   await tx.listingImage.deleteMany({
      //     where: {
      //       listingId: id,
      //     },
      //   });
      //   await tx.listingImage.createMany({
      //     data: imagePaths.map((path, index) => ({
      //       url: `${process.env.BASE_URL}/${path}`,
      //       listingId: id,
      //       isMain: index === 0,
      //       order: index,
      //     })),
      //   });
      // });
    }

    const updatedListing = await prisma.listing.update({
      where: {
        id: id,
      },
      data: validatedData,
    });

    res.status(200).json({
      success: true,
      message: "listing updated successfully",
      data: updatedListing,
    });
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
