import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { createModuleLogger } from "./logger.config.js";
import type { Request } from "express";

const log = createModuleLogger('CloudinaryUpload')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}); 

const ALLOWED_MIME_TYPES: string[] = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.",
      ),
    );
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export interface CloudinaryUploadResult {
  publicId: string;
  cloudinaryUrl: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  sizeBytes: number;
  width: number;
  height: number;
  folder: string;
  originalFileName: string;
}

export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string = "general",
): Promise<CloudinaryUploadResult> {
  log.info("Uploading file to Cloudinary", {
    folder: `school-management/${folder}`,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `school-management/${folder}`,
        resource_type: "auto",
        transformation: [
          { width: 1200, height: 630, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error ?? !result) {
          log.error("Cloudinary upload failed", {
            error: error?.message,
            folder,
            originalname: file.originalname,
          });
          reject(new Error("Failed to upload file"));
        } else {
          log.info("File uploaded to Cloudinary successfully", {
            publicId: result.public_id,
            url: result.secure_url,
            folder,
            originalname: file.originalname,
            size: file.size,
            format: result.format,
            width: result.width,
            height: result.height,
          });
          resolve({
            publicId: result.public_id,
            cloudinaryUrl: result.url,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            format: result.format,
            sizeBytes: result.bytes,
            width: result.width,
            height: result.height,
            folder: `school-management/${folder}`,
            originalFileName: file.originalname,
          });
        }
      },
    );
    stream.end(file.buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    log.info("Image deleted from Cloudinary", { publicId });
  } catch (error) {
    const err = error as Error;
    log.error("Cloudinary delete failed", {
      error: err.message,
      publicId,
    });
  }
}

export function extractPublicId(imageUrl: string): string | null {
  const regex = /\/school-management\/(.+)\.[a-z]{3,4}$/i;
  const match = imageUrl.match(regex);
  return match ? `school-management/${match[1]}` : null;
}

export default cloudinary;