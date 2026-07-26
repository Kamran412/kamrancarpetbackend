import cloudinary from "@/config/cloudinary";
import { ApiError } from "@/utils/ApiError";

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Uploads a buffer to Cloudinary inside the given folder.
 * Cloudinary handles compression, WebP conversion, and thumbnail
 * generation automatically via the eager/transformation pipeline below.
 * The raw file bytes are NEVER persisted to our own database — only the
 * resulting secure_url and public_id are stored.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  options: { publicId?: string } = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: options.publicId,
        resource_type: "image",
        format: "webp",
        quality: "auto:good",
        fetch_format: "auto",
        eager: [{ width: 400, height: 500, crop: "fill", format: "webp" }], // auto thumbnail
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          return reject(ApiError.internal(`Cloudinary upload failed: ${error?.message ?? "unknown error"}`));
        }
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
