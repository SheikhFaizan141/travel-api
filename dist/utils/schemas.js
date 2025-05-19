"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
exports.IdSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
