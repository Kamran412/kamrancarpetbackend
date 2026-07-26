import { Router } from "express";
import * as productController from "@/controllers/product.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";
import { upload } from "@/middlewares/upload.middleware";

const router = Router();

// Public
router.get("/", productController.getProducts);
router.get("/:slug", productController.getProductBySlug);

// Admin only
router.post("/", requireAuth, requireAdmin, productController.createProduct);
router.put("/:id", requireAuth, requireAdmin, productController.updateProduct);
router.delete("/:id", requireAuth, requireAdmin, productController.deleteProduct);
router.post("/bulk-delete", requireAuth, requireAdmin, productController.bulkDeleteProducts);
router.post("/:id/duplicate", requireAuth, requireAdmin, productController.duplicateProduct);

router.post(
  "/:id/images",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  productController.uploadProductImage
);
router.delete("/images/:imageId", requireAuth, requireAdmin, productController.deleteProductImage);

export default router;
