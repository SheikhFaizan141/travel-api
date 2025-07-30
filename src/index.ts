import express, { Request, Response } from "express";
import apiRoutes from "./routes/api";
import authRoutes from "./routes/authRoutes";
import cors from "cors";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for http://localhost:3000
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow frontend origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allowed methods
    credentials: true, // Allow cookies and headers
  })
);

app.use(cookieParser());

app.use("/uploads", express.static("uploads"));

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Travel API");
});

app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

// 404 Handler (for unmatched routes)
app.use(notFoundMiddleware);

app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
