import prisma from "@/config/prisma";
import { ApiError } from "@/utils/ApiError";
import { OrderStatus, Prisma } from "@prisma/client";

interface CreateOrderInput {
  userId?: string;
  guestEmail?: string;
  guestName?: string;
  items: { productId: string; sizeLabel?: string; quantity: number }[];
  shippingAddress: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  couponCode?: string;
  shippingCharge?: number;
  taxAmount?: number;
  currency?: string;
}

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KC-${ts}-${rand}`;
}

export async function createOrder(input: CreateOrderInput) {
  if (!input.userId && !input.guestEmail) {
    throw ApiError.badRequest("Either an authenticated user or guest email is required");
  }
  if (!input.items.length) throw ApiError.badRequest("Order must contain at least one item");

  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
  });

  let subtotal = 0;
  const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw ApiError.notFound(`Product ${item.productId} not found`);
    if (product.stock < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for ${product.name}`);
    }

    const unitPrice = Number(product.salePrice ?? product.price);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      sizeLabel: item.sizeLabel,
      quantity: item.quantity,
      unitPrice,
      total: lineTotal,
    });
  }

  let discountAmount = 0;
  if (input.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
    if (coupon && coupon.isActive) {
      discountAmount =
        coupon.discountType === "PERCENTAGE" ? (subtotal * Number(coupon.discountValue)) / 100 : Number(coupon.discountValue);
      discountAmount = Math.min(discountAmount, subtotal);
    }
  }

  const shippingCharge = input.shippingCharge ?? 0;
  const taxAmount = input.taxAmount ?? 0;
  const total = subtotal - discountAmount + shippingCharge + taxAmount;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: input.userId,
        guestEmail: input.guestEmail,
        guestName: input.guestName,
        subtotal,
        shippingCharge,
        taxAmount,
        discountAmount,
        total,
        currency: input.currency ?? "USD",
        couponCode: input.couponCode,
        shippingAddress: input.shippingAddress as Prisma.InputJsonValue,
        billingAddress: input.billingAddress as Prisma.InputJsonValue,
        items: { createMany: { data: orderItemsData } },
      },
      include: { items: true },
    });

    // decrement stock
    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    if (input.couponCode) {
      await tx.coupon.updateMany({
        where: { code: input.couponCode.toUpperCase() },
        data: { usedCount: { increment: 1 } },
      });
    }

    return created;
  });

  return order;
}

export async function listOrders(filters: { status?: OrderStatus; page: number; limit: number }) {
  const where: Prisma.OrderWhereInput = filters.status ? { status: filters.status } : {};
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.order.count({ where }),
  ]);
  return { items, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function updateOrderStatus(id: string, status: OrderStatus, trackingNumber?: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw ApiError.notFound("Order not found");

  return prisma.order.update({
    where: { id },
    data: { status, ...(trackingNumber ? { trackingNumber } : {}) },
  });
}
