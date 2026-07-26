import { Router } from "express";
import * as reviewController from "@/controllers/review.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.post("/", requireAuth, reviewController.createReview);

router.get("/", requireAuth, requireAdmin, reviewController.listReviewsForAdmin);
router.patch("/:id/approve", requireAuth, requireAdmin, reviewController.approveReview);
router.patch("/:id/reject", requireAuth, requireAdmin, reviewController.rejectReview);
router.post("/:id/reply", requireAuth, requireAdmin, reviewController.replyToReview);
router.delete("/:id", requireAuth, requireAdmin, reviewController.deleteReview);

export default router;
