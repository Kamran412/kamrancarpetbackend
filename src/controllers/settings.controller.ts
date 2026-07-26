import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import prisma from "@/config/prisma";

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.setting.findMany();
  const merged = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, unknown>);
  res.status(200).json({ success: true, data: merged });
});

export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key, value } = req.body as { key: string; value: unknown };
  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value: value as any },
    create: { id: key, key, value: value as any },
  });
  res.status(200).json({ success: true, message: "Setting updated", data: setting });
});
