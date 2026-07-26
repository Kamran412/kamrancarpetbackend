import { Router } from "express";
import * as inquiryController from "@/controllers/inquiry.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.post("/", inquiryController.createInquiry);
router.get("/", requireAuth, requireAdmin, inquiryController.listInquiries);
router.patch("/:id/resolve", requireAuth, requireAdmin, inquiryController.resolveInquiry);

export default router;
