import { Router } from "express";
import * as currencyController from "@/controllers/currency.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.get("/", currencyController.getCurrencies);
router.post("/", requireAuth, requireAdmin, currencyController.upsertCurrency);
router.delete("/:id", requireAuth, requireAdmin, currencyController.deleteCurrency);

export default router;
