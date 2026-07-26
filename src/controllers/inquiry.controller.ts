import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import prisma from "@/config/prisma";
import { z } from "zod";

const inquirySchema = z.object({
  type: z.enum(["B2B", "BULK", "CUSTOM_CARPET", "QUOTE"]),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(5),
  metadata: z.record(z.unknown()).optional(),
});

export const createInquiry = asyncHandler(async (req: Request, res: Response) => {
  const input = inquirySchema.parse(req.body);
  const inquiry = await prisma.inquiry.create({ data: input as any });
  res.status(201).json({ success: true, message: "Inquiry submitted, our team will reach out shortly", data: inquiry });
});

export const listInquiries = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  const inquiries = await prisma.inquiry.findMany({
    where: type ? { type } : {},
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({ success: true, data: inquiries });
});

export const resolveInquiry = asyncHandler(async (req: Request, res: Response) => {
  const inquiry = await prisma.inquiry.update({ where: { id: req.params.id }, data: { isResolved: true } });
  res.status(200).json({ success: true, message: "Inquiry marked as resolved", data: inquiry });
});
