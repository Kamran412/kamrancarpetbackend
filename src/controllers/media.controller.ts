import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import prisma from "@/config/prisma";
import * as cloudinaryService from "@/services/cloudinary.service";
import { CLOUDINARY_ROOT_FOLDER } from "@/config/cloudinary";

export const listMedia = asyncHandler(async (req: Request, res: Response) => {
  const folder = (req.query.folder as string) || undefined;
  const media = await prisma.mediaAsset.findMany({
    where: folder ? { folder } : {},
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({ success: true, data: media });
});

export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file provided");
  const subFolder = (req.body.folder as string) || "misc";
  const folder = `${CLOUDINARY_ROOT_FOLDER}/${subFolder}`;

  const result = await cloudinaryService.uploadBufferToCloudinary(req.file.buffer, folder);

  const asset = await prisma.mediaAsset.create({
    data: {
      url: result.secureUrl,
      publicId: result.publicId,
      folder,
      fileType: req.file.mimetype,
      sizeBytes: req.file.size,
    },
  });

  res.status(201).json({ success: true, message: "File uploaded", data: asset });
});

export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
  if (!asset) throw ApiError.notFound("Asset not found");
  await cloudinaryService.deleteFromCloudinary(asset.publicId);
  await prisma.mediaAsset.delete({ where: { id: asset.id } });
  res.status(200).json({ success: true, message: "Asset deleted" });
});
