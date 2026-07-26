import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { collectionSchema } from "@/validators/common.validator";
import prisma from "@/config/prisma";

export const getCollections = asyncHandler(async (_req: Request, res: Response) => {
  const collections = await prisma.collection.findMany({ orderBy: { name: "asc" } });
  res.status(200).json({ success: true, data: collections });
});

export const getCollectionBySlug = asyncHandler(async (req: Request, res: Response) => {
  const collection = await prisma.collection.findUnique({ where: { slug: req.params.slug } });
  res.status(200).json({ success: true, data: collection });
});

export const createCollection = asyncHandler(async (req: Request, res: Response) => {
  const input = collectionSchema.parse(req.body);
  const collection = await prisma.collection.create({ data: input });
  res.status(201).json({ success: true, message: "Collection created", data: collection });
});

export const updateCollection = asyncHandler(async (req: Request, res: Response) => {
  const input = collectionSchema.partial().parse(req.body);
  const collection = await prisma.collection.update({ where: { id: req.params.id }, data: input });
  res.status(200).json({ success: true, message: "Collection updated", data: collection });
});

export const deleteCollection = asyncHandler(async (req: Request, res: Response) => {
  await prisma.collection.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: "Collection deleted" });
});
