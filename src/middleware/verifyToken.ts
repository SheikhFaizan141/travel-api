import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { refreshAccessToken } from "./refreshAccessToken";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET as string;

export const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];

  if (!accessToken) {
    return res.status(401).json({ message: "Access token is required" });
  }

  try {
    const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return refreshAccessToken(req, res, next);
    }
    return res.status(403).json({ message: "Invalid access token" });
  }
};
