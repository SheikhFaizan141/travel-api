import { NextFunction, Request, Response } from "express";
import prisma from "../config/db.js";

export const adminGuard = (model: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resource = await prisma[model].findUnique({
      where: { id: parseInt(req.params.id) },
    });

    // Example: Only allow admins to modify resources they don't own
    if (
      resource.userId &&
      resource.userId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this resource" });
    }

    next();
  };
};
