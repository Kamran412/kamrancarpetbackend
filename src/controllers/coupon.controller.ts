import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { couponSchema } from "@/validators/common.validator";
import prisma from "@/config/prisma";

export const getCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.status(200).json({ success: true, data: coupons });
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const input = couponSchema.parse(req.body);
  const coupon = await prisma.coupon.create({
    data: { ...input, expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined },
  });
  res.status(201).json({ success: true, message: "Coupon created", data: coupon });
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const input = couponSchema.partial().parse(req.body);
  const coupon = await prisma.coupon.update({
    where: { id: req.params.id },
    data: { ...input, expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined },
  });
  res.status(200).json({ success: true, message: "Coupon updated", data: coupon });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: "Coupon deleted" });
});

// Validates a coupon code against an order subtotal — used at checkout
export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, subtotal } = req.body as { code: string; subtotal: number };

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) throw ApiError.badRequest("Invalid or inactive coupon code");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw ApiError.badRequest("Coupon has expired");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest("Coupon usage limit reached");
  }
  if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
    throw ApiError.badRequest(`Minimum order value of ${coupon.minOrderValue} required for this coupon`);
  }

  const discount =
    coupon.discountType === "PERCENTAGE" ? (subtotal * Number(coupon.discountValue)) / 100 : Number(coupon.discountValue);

  res.status(200).json({ success: true, data: { code: coupon.code, discount: Math.min(discount, subtotal) } });
});
