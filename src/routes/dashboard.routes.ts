import { Router } from "express";
import * as dashboardController from "@/controllers/dashboard.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/overview", dashboardController.getOverview);
router.get("/revenue-monthly", dashboardController.getMonthlyRevenue);
router.get("/sales-monthly", dashboardController.getMonthlySales);
router.get("/sales-by-country", dashboardController.getCountryWiseSales);
router.get("/top-products", dashboardController.getTopProducts);
router.get("/top-categories", dashboardController.getTopCategories);
router.get("/recent-orders", dashboardController.getRecentOrders);
router.get("/low-stock", dashboardController.getLowStockProducts);

export default router;
