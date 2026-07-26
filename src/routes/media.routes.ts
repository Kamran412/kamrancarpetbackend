import { Router } from "express";
import * as mediaController from "@/controllers/media.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";
import { upload } from "@/middlewares/upload.middleware";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", mediaController.listMedia);
router.post("/", upload.single("file"), mediaController.uploadMedia);
router.delete("/:id", mediaController.deleteMedia);

export default router;
