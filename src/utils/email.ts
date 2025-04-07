import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";

// Function to send password reset email
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/password-reset-template.html"
    );
    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(templateSource);
    const html = template({ resetUrl });

    const transporter = nodemailer.createTransport({
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
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

export default sendPasswordResetEmail;
