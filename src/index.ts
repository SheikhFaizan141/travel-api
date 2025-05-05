import express, { Request, Response } from "express";
import apiRoutes from "./routes/api";
import cors from "cors";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware";

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for http://localhost:3000
app.use(
  cors({
    origin: "http://localhost:3000", // Allow frontend origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allowed methods
    credentials: true, // Allow cookies and headers
  })
);

app.use("/uploads", express.static("uploads"));

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to travel-api! as .🥰d");
});

app.use("/api", apiRoutes);

// 404 Handler (for unmatched routes)
app.use(notFoundMiddleware);

app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
