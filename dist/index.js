"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_1 = __importDefault(require("./routes/api"));
const cors_1 = __importDefault(require("cors"));
const notFoundMiddleware_1 = require("./middleware/notFoundMiddleware");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./swagger");
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Enable CORS for http://localhost:3000
app.use((0, cors_1.default)({
    origin: "http://localhost:3000", // Allow frontend origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allowed methods
    credentials: true, // Allow cookies and headers
}));
app.use("/uploads", express_1.default.static("uploads"));
app.use(express_1.default.json());
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.get("/", (req, res) => {
    res.send("Welcome to travel-api! as .🥰d");
});
app.use("/api", api_1.default);
// app.use("/auth", authRoutes);
// 404 Handler (for unmatched routes)
app.use(notFoundMiddleware_1.notFoundMiddleware);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
