import { Router } from "express";
import * as couponController from "@/controllers/coupon.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.post("/validate", couponController.validateCoupon);

router.get("/", requireAuth, requireAdmin, couponController.getCoupons);
router.post("/", requireAuth, requireAdmin, couponController.createCoupon);
router.put("/:id", requireAuth, requireAdmin, couponController.updateCoupon);
router.delete("/:id", requireAuth, requireAdmin, couponController.deleteCoupon);

export default router;
