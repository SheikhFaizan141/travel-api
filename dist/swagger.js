"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const yamljs_1 = __importDefault(require("yamljs"));
const authPaths = yamljs_1.default.load("./src/swagger-docs/auth.yaml");
const listingPaths = yamljs_1.default.load("./src/swagger-docs/listing.yaml");
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Travel API",
            version: "1.0.0",
            description: "API documentation for the Travel App",
        },
        servers: [
            {
                url: "http://localhost:3000", // Update with your server URL
                description: "Local server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        paths: { ...authPaths, ...listingPaths },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // apis: ["./src/routes/*.ts"], // Path to your API routes
    apis: [],
};
console.log(JSON.stringify((0, swagger_jsdoc_1.default)(options), null, 2));
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
