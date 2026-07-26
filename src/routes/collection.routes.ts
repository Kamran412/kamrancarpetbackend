import { Router } from "express";
import * as collectionController from "@/controllers/collection.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.get("/", collectionController.getCollections);
router.get("/:slug", collectionController.getCollectionBySlug);
router.post("/", requireAuth, requireAdmin, collectionController.createCollection);
router.put("/:id", requireAuth, requireAdmin, collectionController.updateCollection);
router.delete("/:id", requireAuth, requireAdmin, collectionController.deleteCollection);

export default router;
