import { Router } from "express";
import * as activityLogController from "@/controllers/activityLog.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", activityLogController.listActivityLogs);

export default router;
