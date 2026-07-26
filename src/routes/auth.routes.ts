import { Router } from "express";
import * as authController from "@/controllers/auth.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { authLimiter } from "@/middlewares/rateLimiter.middleware";

const router = Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.get("/me", requireAuth, authController.me);

export default router;
