import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import prisma from "@/config/prisma";
import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
});

async function recalculateRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAverage: agg._avg.rating ?? 0,
      ratingCount: agg._count._all,
    },
  });
}

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const input = createReviewSchema.parse(req.body);
  const review = await prisma.review.create({
    data: { ...input, userId: req.user!.id, status: "PENDING" },
  });
  res.status(201).json({ success: true, message: "Review submitted for approval", data: review });
});

export const listReviewsForAdmin = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as "PENDING" | "APPROVED" | "REJECTED" | undefined;
  const reviews = await prisma.review.findMany({
    where: status ? { status } : {},
    include: { product: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({ success: true, data: reviews });
});

export const approveReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: "APPROVED" } });
  await recalculateRating(review.productId);
  res.status(200).json({ success: true, message: "Review approved", data: review });
});

export const rejectReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: "REJECTED" } });
  await recalculateRating(review.productId);
  res.status(200).json({ success: true, message: "Review rejected", data: review });
});

export const replyToReview = asyncHandler(async (req: Request, res: Response) => {
  const { reply } = req.body as { reply: string };
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { adminReply: reply } });
  res.status(200).json({ success: true, message: "Reply added", data: review });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw ApiError.notFound("Review not found");
  await prisma.review.delete({ where: { id: review.id } });
  await recalculateRating(review.productId);
  res.status(200).json({ success: true, message: "Review deleted" });
});
