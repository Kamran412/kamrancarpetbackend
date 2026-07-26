import { Router } from "express";
import * as userController from "@/controllers/user.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin, requireSuperAdmin } from "@/middlewares/role.middleware";

const router = Router();

// Self-service (any authenticated customer)
router.put("/profile", requireAuth, userController.updateProfile);
router.get("/addresses", requireAuth, userController.listAddresses);
router.post("/addresses", requireAuth, userController.addAddress);
router.delete("/addresses/:id", requireAuth, userController.deleteAddress);

router.get("/wishlist", requireAuth, userController.getWishlist);
router.post("/wishlist/toggle", requireAuth, userController.toggleWishlist);

router.get("/compare", requireAuth, userController.getCompareList);
router.post("/compare/toggle", requireAuth, userController.toggleCompare);

router.post("/recently-viewed", requireAuth, userController.recordRecentlyViewed);
router.get("/recently-viewed", requireAuth, userController.getRecentlyViewed);

// Admin: staff/admin account management (super-admin only)
router.get("/admins", requireAuth, requireSuperAdmin, userController.listAdmins);
router.post("/admins/grant", requireAuth, requireSuperAdmin, userController.grantAdminRole);
router.patch("/admins/:id/role", requireAuth, requireSuperAdmin, userController.updateAdminRole);
router.patch("/admins/:id/revoke", requireAuth, requireSuperAdmin, userController.revokeAdminAccess);

// Admin: customer management
router.get("/", requireAuth, requireAdmin, userController.listCustomers);
router.get("/:id", requireAuth, requireAdmin, userController.getCustomerDetail);
router.patch("/:id/toggle-status", requireAuth, requireAdmin, userController.toggleCustomerStatus);

export default router;
