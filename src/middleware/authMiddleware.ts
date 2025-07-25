import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. Try Authorization header
  const authHeader = req.header("Authorization");
  let token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  // 2. Fallback to cookie
  // console.log("Using token from cookies", req.cookies);
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    req.userId = String(payload.userId);
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
    return;
  }
};
