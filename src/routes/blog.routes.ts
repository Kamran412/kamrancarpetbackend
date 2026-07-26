import { Router } from "express";
import * as blogController from "@/controllers/blog.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireAdmin } from "@/middlewares/role.middleware";

const router = Router();

router.get("/", blogController.getBlogs);
router.get("/:slug", blogController.getBlogBySlug);

router.get("/admin/all", requireAuth, requireAdmin, blogController.listBlogsAdmin);
router.post("/", requireAuth, requireAdmin, blogController.createBlog);
router.put("/:id", requireAuth, requireAdmin, blogController.updateBlog);
router.delete("/:id", requireAuth, requireAdmin, blogController.deleteBlog);

export default router;
