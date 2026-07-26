import { Router } from "express";
import authRoutes from "@/routes/auth.routes";
import productRoutes from "@/routes/product.routes";
import categoryRoutes from "@/routes/category.routes";
import collectionRoutes from "@/routes/collection.routes";
import orderRoutes from "@/routes/order.routes";
import userRoutes from "@/routes/user.routes";
import reviewRoutes from "@/routes/review.routes";
import couponRoutes from "@/routes/coupon.routes";
import currencyRoutes from "@/routes/currency.routes";
import youtubeRoutes from "@/routes/youtube.routes";
import dashboardRoutes from "@/routes/dashboard.routes";
import settingsRoutes from "@/routes/settings.routes";
import mediaRoutes from "@/routes/media.routes";
import blogRoutes from "@/routes/blog.routes";
import inquiryRoutes from "@/routes/inquiry.routes";
import activityLogRoutes from "@/routes/activityLog.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/collections", collectionRoutes);
router.use("/orders", orderRoutes);
router.use("/users", userRoutes);
router.use("/reviews", reviewRoutes);
router.use("/coupons", couponRoutes);
router.use("/currencies", currencyRoutes);
router.use("/youtube-videos", youtubeRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settings", settingsRoutes);
router.use("/media", mediaRoutes);
router.use("/blogs", blogRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/activity-logs", activityLogRoutes);

export default router;
