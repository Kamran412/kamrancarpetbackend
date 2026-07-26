import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import prisma from "@/config/prisma";
import { z } from "zod";

const currencySchema = z.object({
  code: z.string().length(3).toUpperCase(),
  symbol: z.string().min(1).max(5),
  rateToBase: z.number().positive(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const getCurrencies = asyncHandler(async (_req: Request, res: Response) => {
  const currencies = await prisma.currency.findMany({ orderBy: { code: "asc" } });
  res.status(200).json({ success: true, data: currencies });
});

export const upsertCurrency = asyncHandler(async (req: Request, res: Response) => {
  const input = currencySchema.parse(req.body);

  if (input.isDefault) {
    await prisma.currency.updateMany({ data: { isDefault: false }, where: {} });
  }

  const currency = await prisma.currency.upsert({
    where: { code: input.code },
    update: input,
    create: input,
  });

  res.status(200).json({ success: true, message: "Currency saved", data: currency });
});

export const deleteCurrency = asyncHandler(async (req: Request, res: Response) => {
  await prisma.currency.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: "Currency removed" });
});
