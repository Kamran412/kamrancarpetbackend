import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import prisma from "@/config/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";
import { logActivity } from "@/utils/activityLog";

// ---- Admin: staff/admin account management ----

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR"];

export const listAdmins = asyncHandler(async (_req: Request, res: Response) => {
  const admins = await prisma.user.findMany({
    where: { role: { in: ADMIN_ROLES } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
  });
  res.status(200).json({ success: true, data: admins });
});

const grantAdminSchema = z.object({
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR"]),
});

/**
 * Promotes an existing user (who has already signed up as a customer via
 * Supabase) to a staff role. Since account creation itself happens through
 * Supabase Auth, admins are granted access by email rather than created
 * directly here.
 */
export const grantAdminRole = asyncHandler(async (req: Request, res: Response) => {
  const { email, role } = grantAdminSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.notFound(
      "No account found for that email. The person must sign up on the site first, then can be granted admin access."
    );
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data: { role } });
  await logActivity(req, "ADMIN_ROLE_GRANTED", "User", updated.id, { email, role });
  res.status(200).json({ success: true, message: "Admin access granted", data: updated });
});

export const updateAdminRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = z.object({ role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "CUSTOMER"]) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound("User not found");
  const updated = await prisma.user.update({ where: { id: user.id }, data: { role } });
  await logActivity(req, "ADMIN_ROLE_UPDATED", "User", updated.id, { role });
  res.status(200).json({ success: true, message: "Role updated", data: updated });
});

export const revokeAdminAccess = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound("User not found");
  const updated = await prisma.user.update({ where: { id: user.id }, data: { role: "CUSTOMER" } });
  await logActivity(req, "ADMIN_ACCESS_REVOKED", "User", updated.id);
  res.status(200).json({ success: true, message: "Admin access revoked", data: updated });
});

// ---- Admin: customer management ----

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  res.status(200).json({ success: true, items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export const getCustomerDetail = asyncHandler(async (req: Request, res: Response) => {
  const customer = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { orders: true, addresses: true, wishlist: { include: { product: true } } },
  });
  if (!customer) throw ApiError.notFound("Customer not found");
  res.status(200).json({ success: true, data: customer });
});

export const toggleCustomerStatus = asyncHandler(async (req: Request, res: Response) => {
  const customer = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!customer) throw ApiError.notFound("Customer not found");
  const updated = await prisma.user.update({ where: { id: customer.id }, data: { isActive: !customer.isActive } });
  res.status(200).json({ success: true, message: "Customer status updated", data: updated });
});

// ---- Self-service: profile, addresses, wishlist, compare, recently viewed ----

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(5),
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone } = req.body as { name?: string; phone?: string };
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: { name, phone } });
  res.status(200).json({ success: true, message: "Profile updated", data: user });
});

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await prisma.address.findMany({ where: { userId: req.user!.id } });
  res.status(200).json({ success: true, data: addresses });
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const input = addressSchema.parse(req.body);
  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({ data: { ...input, userId: req.user!.id } });
  res.status(201).json({ success: true, message: "Address added", data: address });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  await prisma.address.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: "Address deleted" });
});

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
  });
  res.status(200).json({ success: true, data: wishlist });
});

export const toggleWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.body as { productId: string };
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: req.user!.id, productId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return res.status(200).json({ success: true, message: "Removed from wishlist", data: { inWishlist: false } });
  }
  await prisma.wishlistItem.create({ data: { userId: req.user!.id, productId } });
  res.status(201).json({ success: true, message: "Added to wishlist", data: { inWishlist: true } });
});

export const getCompareList = asyncHandler(async (req: Request, res: Response) => {
  const items = await prisma.compareItem.findMany({ where: { userId: req.user!.id }, include: { product: true } });
  res.status(200).json({ success: true, data: items });
});

export const toggleCompare = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.body as { productId: string };
  const existing = await prisma.compareItem.findUnique({
    where: { userId_productId: { userId: req.user!.id, productId } },
  });
  if (existing) {
    await prisma.compareItem.delete({ where: { id: existing.id } });
    return res.status(200).json({ success: true, message: "Removed from compare", data: { inCompare: false } });
  }
  await prisma.compareItem.create({ data: { userId: req.user!.id, productId } });
  res.status(201).json({ success: true, message: "Added to compare", data: { inCompare: true } });
});

export const recordRecentlyViewed = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.body as { productId: string };
  await prisma.recentlyViewed.upsert({
    where: { userId_productId: { userId: req.user!.id, productId } },
    update: { viewedAt: new Date() },
    create: { userId: req.user!.id, productId },
  });
  res.status(200).json({ success: true, message: "Recorded" });
});

export const getRecentlyViewed = asyncHandler(async (req: Request, res: Response) => {
  const items = await prisma.recentlyViewed.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
    orderBy: { viewedAt: "desc" },
    take: 12,
  });
  res.status(200).json({ success: true, data: items });
});
