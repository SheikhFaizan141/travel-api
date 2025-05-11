import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import YAML from "yamljs";
const authPaths = YAML.load("./src/swagger-docs/auth.yaml");
const listingPaths = YAML.load("./src/swagger-docs/listing.yaml");

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

console.log(JSON.stringify(swaggerJsdoc(options), null, 2));

export const swaggerSpec = swaggerJsdoc(options);
