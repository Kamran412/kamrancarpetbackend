import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from "@/validators/product.validator";
import * as productService from "@/services/product.service";
import * as cloudinaryService from "@/services/cloudinary.service";
import { validateProductImage, cropToProductRatio } from "@/services/imageValidation.service";
import { CLOUDINARY_FOLDERS } from "@/config/cloudinary";
import prisma from "@/config/prisma";
import { logActivity } from "@/utils/activityLog";

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = productQuerySchema.parse(req.query);
  const result = await productService.listProducts(query);
  res.status(200).json({ success: true, ...result });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductBySlug(req.params.slug);
  res.status(200).json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = createProductSchema.parse(req.body);
  const product = await productService.createProduct(input);
  await logActivity(req, "PRODUCT_CREATED", "Product", product.id, { name: product.name });
  res.status(201).json({ success: true, message: "Product created", data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = updateProductSchema.parse(req.body);
  const product = await productService.updateProduct(req.params.id, input);
  await logActivity(req, "PRODUCT_UPDATED", "Product", product.id, { name: product.name });
  res.status(200).json({ success: true, message: "Product updated", data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.params.id);
  await logActivity(req, "PRODUCT_DELETED", "Product", req.params.id);
  res.status(200).json({ success: true, message: "Product deleted" });
});

export const bulkDeleteProducts = asyncHandler(async (req: Request, res: Response) => {
  const ids: string[] = req.body.ids ?? [];
  if (!ids.length) throw ApiError.badRequest("No product ids provided");
  await productService.bulkDeleteProducts(ids);
  await logActivity(req, "PRODUCT_BULK_DELETED", "Product", undefined, { ids });
  res.status(200).json({ success: true, message: `${ids.length} product(s) deleted` });
});

export const duplicateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.duplicateProduct(req.params.id);
  res.status(201).json({ success: true, message: "Product duplicated", data: product });
});

/**
 * Handles product image upload.
 * Validates the 4:5 aspect-ratio rule from the spec:
 *  - If a `crop` payload is supplied (from the frontend cropper), crop server-side first.
 *  - Otherwise validate the raw image and reject with a clear error if the ratio/resolution don't match,
 *    so the frontend can prompt the admin to open the cropper.
 */
export const uploadProductImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No image file provided");

  const productId = req.params.id;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("Product not found");

  let buffer = req.file.buffer;

  if (req.body.crop) {
    const crop = JSON.parse(req.body.crop);
    buffer = await cropToProductRatio(req.file.buffer, crop);
  } else {
    const validation = await validateProductImage(buffer);
    if (!validation.isValidRatio || !validation.meetsMinResolution) {
      throw ApiError.badRequest(
        "Image does not meet the required 4:5 aspect ratio or minimum 1200x1500 resolution. Please use the crop tool.",
        validation
      );
    }
  }

  const result = await cloudinaryService.uploadBufferToCloudinary(buffer, CLOUDINARY_FOLDERS.products, {
    publicId: `${product.slug}-${Date.now()}`,
  });

  const position = await prisma.productImage.count({ where: { productId } });

  const image = await prisma.productImage.create({
    data: {
      productId,
      url: result.secureUrl,
      publicId: result.publicId,
      position,
    },
  });

  // First image uploaded becomes the featured image by default if none is set yet
  if (!product.featuredImage) {
    await prisma.product.update({ where: { id: productId }, data: { featuredImage: result.secureUrl } });
  }

  res.status(201).json({ success: true, message: "Image uploaded", data: image });
});

export const deleteProductImage = asyncHandler(async (req: Request, res: Response) => {
  const image = await prisma.productImage.findUnique({ where: { id: req.params.imageId } });
  if (!image) throw ApiError.notFound("Image not found");

  await cloudinaryService.deleteFromCloudinary(image.publicId);
  await prisma.productImage.delete({ where: { id: image.id } });

  res.status(200).json({ success: true, message: "Image deleted" });
});
