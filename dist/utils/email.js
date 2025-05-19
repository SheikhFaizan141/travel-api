"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
// Function to send password reset email
async function sendPasswordResetEmail(email, resetUrl) {
    try {
        const templatePath = path_1.default.join(__dirname, "../templates/password-reset-template.html");
        const templateSource = fs_1.default.readFileSync(templatePath, "utf8");
        const template = handlebars_1.default.compile(templateSource);
        const html = template({ resetUrl });
        const transporter = nodemailer_1.default.createTransport({
            host: "mailpit_dev", // Mailpit runs on localhost
            port: 1025, // Mailpit's SMTP port
            secure: false, // No TLS/SSL required for Mailpit
            tls: {
                rejectUnauthorized: false, // Disable TLS certificate validation for local testing
            },
        });
        const mailOptions = {
            from: "Billion dollar startup", // Sender address
            to: email, // Recipient address
            subject: "Password Reset Request", // Email subject
            text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`, // Plain text body
            html,
        };
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log("Password reset email sent:", info.messageId);
    }
    catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error("Failed to send password reset email");
    }
}
exports.default = sendPasswordResetEmail;
