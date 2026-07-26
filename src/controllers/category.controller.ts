import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { categorySchema } from "@/validators/common.validator";
import prisma from "@/config/prisma";
import * as cloudinaryService from "@/services/cloudinary.service";
import { CLOUDINARY_FOLDERS } from "@/config/cloudinary";

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { name: "asc" },
  });
  res.status(200).json({ success: true, data: categories });
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { children: true },
  });
  if (!category) throw ApiError.notFound("Category not found");
  res.status(200).json({ success: true, data: category });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = categorySchema.parse(req.body);
  const category = await prisma.category.create({ data: input });
  res.status(201).json({ success: true, message: "Category created", data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({ where: { id: req.params.id }, data: input });
  res.status(200).json({ success: true, message: "Category updated", data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: "Category deleted" });
});

export const uploadCategoryImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No image provided");
  const field = req.body.type === "banner" ? "bannerUrl" : "imageUrl";
  const result = await cloudinaryService.uploadBufferToCloudinary(req.file.buffer, CLOUDINARY_FOLDERS.categories);
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: { [field]: result.secureUrl },
  });
  res.status(200).json({ success: true, message: "Image uploaded", data: category });
});
