import { Router } from "express";
import * as orderController from "@/controllers/order.controller";
import { requireAuth, optionalAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.post("/", optionalAuth, orderController.createOrder); // guest checkout supported
router.get("/my-orders", requireAuth, orderController.getMyOrders);
router.get("/track/:orderNumber", orderController.trackOrder);

router.get("/", requireAuth, requireAdmin, orderController.listOrders);
router.patch("/:id/status", requireAuth, requireAdmin, orderController.updateOrderStatus);

export default router;
