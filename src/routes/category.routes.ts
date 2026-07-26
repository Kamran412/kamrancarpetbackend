import { Router } from "express";
import * as categoryController from "@/controllers/category.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";
import { upload } from "@/middlewares/upload.middleware";

const router = Router();

router.get("/", categoryController.getCategories);
router.get("/:slug", categoryController.getCategoryBySlug);

router.post("/", requireAuth, requireAdmin, categoryController.createCategory);
router.put("/:id", requireAuth, requireAdmin, categoryController.updateCategory);
router.delete("/:id", requireAuth, requireAdmin, categoryController.deleteCategory);
router.post(
  "/:id/image",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  categoryController.uploadCategoryImage
);

export default router;
