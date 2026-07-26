import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import prisma from "@/config/prisma";

export const listActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const entity = req.query.entity as string | undefined;

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: entity ? { entity } : {},
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.activityLog.count({ where: entity ? { entity } : {} }),
  ]);

  res.status(200).json({
    success: true,
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
