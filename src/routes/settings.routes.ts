import { Router } from "express";
import * as settingsController from "@/controllers/settings.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireSuperAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.get("/", settingsController.getSettings);
router.put("/", requireAuth, requireSuperAdmin, settingsController.updateSetting);

export default router;
