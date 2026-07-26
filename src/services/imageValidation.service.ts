import sharp from "sharp";
import { ApiError } from "@/utils/ApiError";

const REQUIRED_RATIO = 4 / 5; // width:height
const RATIO_TOLERANCE = 0.01; // small tolerance for rounding (e.g. 1200x1500 vs 1199x1500)
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 1500;

export interface ImageValidationResult {
  width: number;
  height: number;
  ratio: number;
  isValidRatio: boolean;
  meetsMinResolution: boolean;
}

/**
 * Validates an uploaded product image buffer against the platform's
 * fixed 4:5 aspect ratio and minimum resolution rules.
 *
 * Does NOT throw for a bad ratio by itself — callers decide whether to
 * reject outright or prompt the admin to use the crop tool, per spec:
 * "If incorrect -> Show validation error OR Open Image Cropper".
 */
export async function validateProductImage(buffer: Buffer): Promise<ImageValidationResult> {
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw ApiError.badRequest("Could not read image dimensions. The file may be corrupted.");
  }

  const { width, height } = metadata;
  const ratio = width / height;
  const isValidRatio = Math.abs(ratio - REQUIRED_RATIO) <= RATIO_TOLERANCE;
  const meetsMinResolution = width >= MIN_WIDTH && height >= MIN_HEIGHT;

  return { width, height, ratio, isValidRatio, meetsMinResolution };
}

/**
 * Crops a buffer to a centered 4:5 region matching the dimensions the
 * frontend cropper reports (x, y, width, height in source-image pixels),
 * then re-encodes as WebP for optimal delivery.
 */
export async function cropToProductRatio(
  buffer: Buffer,
  crop: { x: number; y: number; width: number; height: number }
): Promise<Buffer> {
  return sharp(buffer)
    .extract({
      left: Math.round(crop.x),
      top: Math.round(crop.y),
      width: Math.round(crop.width),
      height: Math.round(crop.height),
    })
    .webp({ quality: 90 })
    .toBuffer();
}
