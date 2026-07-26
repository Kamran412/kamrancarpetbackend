import { Router } from "express";
import * as youtubeController from "@/controllers/youtube.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.get("/", youtubeController.getVideos);
router.post("/", requireAuth, requireAdmin, youtubeController.addVideo);
router.delete("/:id", requireAuth, requireAdmin, youtubeController.deleteVideo);

export default router;
