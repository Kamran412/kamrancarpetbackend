import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import * as orderService from "@/services/order.service";
import * as paymentService from "@/services/payment.service";
import prisma from "@/config/prisma";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { logActivity } from "@/utils/activityLog";

const createOrderSchema = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), sizeLabel: z.string().optional(), quantity: z.number().int().positive() })),
  guestEmail: z.string().email().optional(),
  guestName: z.string().optional(),
  shippingAddress: z.record(z.unknown()),
  billingAddress: z.record(z.unknown()).optional(),
  couponCode: z.string().optional(),
  shippingCharge: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  paymentProvider: z.enum(["STRIPE", "RAZORPAY"]),
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const input = createOrderSchema.parse(req.body);

  const order = await orderService.createOrder({
    ...input,
    userId: req.user?.id,
  });

  let paymentPayload: Record<string, unknown> = {};

  if (input.paymentProvider === "STRIPE") {
    const intent = await paymentService.createStripePaymentIntent(Number(order.total), order.currency, order.id);
    paymentPayload = { clientSecret: intent.client_secret };
  } else {
    const rzpOrder = await paymentService.createRazorpayOrder(Number(order.total), order.currency, order.id);
    paymentPayload = { razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency };
  }

  await prisma.order.update({ where: { id: order.id }, data: { paymentProvider: input.paymentProvider } });

  res.status(201).json({ success: true, message: "Order created", data: { order, payment: paymentPayload } });
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({ success: true, data: orders });
});

export const trackOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true },
  });
  if (!order) throw ApiError.notFound("Order not found");
  res.status(200).json({ success: true, data: order });
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as OrderStatus | undefined;
  const result = await orderService.listOrders({ status, page, limit });
  res.status(200).json({ success: true, ...result });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, trackingNumber } = req.body as { status: OrderStatus; trackingNumber?: string };
  const order = await orderService.updateOrderStatus(req.params.id, status, trackingNumber);
  await logActivity(req, "ORDER_STATUS_UPDATED", "Order", order.id, { status });
  res.status(200).json({ success: true, message: "Order status updated", data: order });
});
