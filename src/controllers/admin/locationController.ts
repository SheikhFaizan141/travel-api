import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../config/db";
import { Prisma } from "@prisma/client";
import { LocationSchema, UpdateLocationSchema } from "../../schemas/schemas";

const IdSchema = z.object({
  id: z.preprocess((val) => {
    return typeof val === "string" ? Number.parseInt(val, 10) : val;
  }, z.number().int().positive()),
});

const LocationsParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export const getLocations = async (req: Request, res: Response) => {
  try {
    // validate the query parameters for page and limit
    const { page = 1, limit = 10 } = LocationsParamsSchema.parse(req.query);

    const locations = await prisma.location.findMany({
      take: limit,
      skip: limit * (page - 1),
    });

    res.status(200).json({
      data: locations,
    });
    // res.status(200).json({
    //   data: [
    //     {
    //       id: 1,
    //     },
    //   ],
    // });
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

export const createLocation = async (req: Request, res: Response) => {
  try {
    const validatedData = LocationSchema.parse(req.body);

    const featuredImage = req.file;

    let fileUrl = "";
    if (featuredImage) {
      // Generate the file URL
      const baseUrl = process.env.BASE_URL; // Replace with your server's base URL
      fileUrl = `${baseUrl}/${featuredImage.path.replace(/\\/g, "/")}`;
    }

    const newLocation = await prisma.location.create({
      data: {
        ...validatedData,
        featured_image: fileUrl,
      },
    });

    res.status(201).json({
      success: true,
      message: "Location created",
      data: newLocation,
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (error.code === "P2002") {
        console.log(
          "There is a unique constraint violation, a new user cannot be created with this email"
        );
      }
    }

    // Handle other errors
    res.status(500).json({ error: "Internal server error", details: error });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { id } = IdSchema.parse(req.params);

    const validatedData = UpdateLocationSchema.parse(req.body);

    await prisma.location.findUniqueOrThrow({
      where: {
        id: id,
      },
    });

    let updateData = {
      ...validatedData,
      // featured_image: location.featured_image ?? "", // Keep the old image if not provided
    };

    // Handle file upload
    if (req.file) {
      // unlink the old image (if any)
      // if(location.featured_image) {
      //   const oldImagePath = location.featured_image.replace(`${process.env.BASE_URL}/`, "");
      //   fs.unlink(oldImagePath, (err) => {
      //     if (err) {
      //       console.error("Error deleting old image", err);
      //     }
      //   });
      // }

      const featuredImage = req.file;
      const baseUrl = process.env.BASE_URL;
      const fileUrl = `${baseUrl}/${featuredImage.path.replace(/\\/g, "/")}`;

      // res.status(200).json({
      //   baseUrl: baseUrl,
      //   fileUrl: fileUrl,
      //   featuredImage: featuredImage,
      // })

      // Update the listing with the new image
      updateData = {
        ...updateData,
        featured_image: fileUrl,
      };
    }

    // Update the listing
    const updatedLocation = await prisma.location.update({
      where: {
        id: id,
      },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Location updated successfully a",
      data: updatedLocation,
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

export const deleteLocation = async (req: Request, res: Response) => {
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
      message: "location deleted successfully",
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
