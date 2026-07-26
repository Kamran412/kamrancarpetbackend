import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import prisma from "@/config/prisma";
import { OrderStatus } from "@prisma/client";

export const getOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [revenueAgg, orderCount, customerCount, productCount, pendingOrders] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      revenue: revenueAgg._sum.total ?? 0,
      orders: orderCount,
      customers: customerCount,
      products: productCount,
      pendingOrders,
    },
  });
});

export const getMonthlyRevenue = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
    SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, SUM(total)::float AS revenue
    FROM "Order"
    WHERE "paymentStatus" = 'PAID'
    GROUP BY month
    ORDER BY month ASC
    LIMIT 12;
  `;
  res.status(200).json({ success: true, data: rows });
});

export const getMonthlySales = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.$queryRaw<Array<{ month: string; orders: number }>>`
    SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*)::int AS orders
    FROM "Order"
    GROUP BY month
    ORDER BY month ASC
    LIMIT 12;
  `;
  res.status(200).json({ success: true, data: rows });
});

export const getCountryWiseSales = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.$queryRaw<Array<{ country: string; orders: number }>>`
    SELECT "shippingAddress"->>'country' AS country, COUNT(*)::int AS orders
    FROM "Order"
    GROUP BY country
    ORDER BY orders DESC
    LIMIT 10;
  `;
  res.status(200).json({ success: true, data: rows });
});

export const getTopProducts = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.orderItem.groupBy({
    by: ["productId", "productName"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });
  res.status(200).json({ success: true, data: rows });
});

export const getTopCategories = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.product.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
    orderBy: { _count: { categoryId: "desc" } },
    take: 10,
  });
  const categoryIds = rows.map((r) => r.categoryId).filter(Boolean) as string[];
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const merged = rows.map((r) => ({
    category: categories.find((c) => c.id === r.categoryId)?.name ?? "Uncategorized",
    productCount: r._count._all,
  }));
  res.status(200).json({ success: true, data: merged });
});

export const getRecentOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });
  res.status(200).json({ success: true, data: orders });
});

export const getLowStockProducts = asyncHandler(async (_req: Request, res: Response) => {
  // Raw query since Prisma can't compare two columns of the same row directly in `where`
  const products = await prisma.$queryRaw`
    SELECT * FROM "Product"
    WHERE stock <= "lowStockThreshold"
    ORDER BY stock ASC
    LIMIT 20;
  `;
  res.status(200).json({ success: true, data: products });
});
