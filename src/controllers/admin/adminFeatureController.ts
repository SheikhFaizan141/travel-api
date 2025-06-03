import { Request, Response } from "express";
import prisma from "../../config/db";
import { z } from "zod";
import {
  createFeatureSchema,
  updateFeatureSchema,
} from "../../schemas/feature-schemas";
import { IdSchema } from "../../schemas/schemas";

export async function getFeatures(req: Request, res: Response) {
  try {
    const features = await prisma.feature.findMany();
    res.json({ success: true, data: features });
  } catch (error) {
    console.error("Error fetching features:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getFeatureById(req: Request, res: Response) {
  try {
    const { id } = IdSchema.parse(req.params);

    const feature = await prisma.feature.findUnique({
      where: { id },
    });

    if (!feature) {
      res.status(404).json({
        success: false,
        message: "Feature not found",
      });

      return;
    }

    res.json({ success: true, data: feature });
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

    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function createFeature(req: Request, res: Response) {
  try {
    const data = createFeatureSchema.parse(req.body);

    // Check for existing feature
    const existingFeature = await prisma.feature.findUnique({
      where: { name: data.name },
    });

    if (existingFeature) {
      res.status(409).json({
        success: false,
        message: "Feature with this name already exists",
        details: {
          field: "name",
          message: "Feature with this name already exists",
        },
      });
      return;
    }

    const feature = await prisma.feature.create({ data });

    res.status(201).json({ success: true, data: feature });
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

    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function updateFeature(req: Request, res: Response) {
  try {
    const { id } = IdSchema.parse(req.params);
    const data = updateFeatureSchema.parse(req.body);

    const existingFeature = await prisma.feature.findUnique({
      where: { id },
    });

    if (!existingFeature) {
      res.status(404).json({
        success: false,
        message: "Feature not found",
      });
      return;
    }

    if (data.name && data.name !== existingFeature.name) {
      const nameExists = await prisma.feature.findUnique({
        where: { name: data.name },
      });

      if (nameExists) {
        res.status(409).json({
          success: false,
          message: "Feature with this name already exists",
        });
        return;
      }
    }

    const updatedFeature = await prisma.feature.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: updatedFeature });
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

    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function deleteFeature(req: Request, res: Response) {
  try {
    const { id } = IdSchema.parse(req.params);

    const feature = await prisma.feature.findUnique({
      where: { id },
    });

    if (!feature) {
      res.status(404).json({
        success: false,
        message: "Feature not found",
      });
      return;
    }

    await prisma.feature.delete({
      where: { id },
    });

    res.status(204).end();
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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
