import nodemailer from "nodemailer";
import { createModuleLogger, logSecurityEvent } from "./logger.config";

const log = createModuleLogger("EmailConfig");

if (
  !process.env.EMAIL_HOST ||
  !process.env.EMAIL_USER ||
  !process.env.EMAIL_PASSWORD ||
  !process.env.EMAIL_FROM ||
  !process.env.EMAIL_FROM_NAME
) {
  throw new Error(
    "Missing required email configuration: EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM, EMAIL_FROM_NAME must be set in .env",
  );
}

export const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT ?? "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

emailTransporter.verify((error) => {
  if (error) {
    log.error("Email transporter verification failed", {
      error: error.message,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
    });
    logSecurityEvent("EMAIL_TRANSPORTER_VERIFICATION_FAILED", "internal", null, {
      error: error.message,
      host: process.env.EMAIL_HOST,
    });
  } else {
    log.info("Email server is ready to send messages", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
    });
  }
});

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    text: options.text,
    html: options.html ?? options.text,
  };

  try {
    log.debug("Sending email", {
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const info = await emailTransporter.sendMail(mailOptions);

    log.info("Email sent successfully", {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    return info;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to send email", {
      error: err.message,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });
    logSecurityEvent("EMAIL_SEND_FAILED", "internal", null, {
      error: err.message,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });
    throw err;
  }
}