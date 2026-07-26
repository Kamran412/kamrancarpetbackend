import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import prisma from "@/config/prisma";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  coverImageUrl: z.string().url().optional(),
  authorName: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const getBlogs = asyncHandler(async (_req: Request, res: Response) => {
  const blogs = await prisma.blog.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" } });
  res.status(200).json({ success: true, data: blogs });
});

export const getBlogBySlug = asyncHandler(async (req: Request, res: Response) => {
  const blog = await prisma.blog.findUnique({ where: { slug: req.params.slug } });
  if (!blog) throw ApiError.notFound("Blog post not found");
  res.status(200).json({ success: true, data: blog });
});

export const listBlogsAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const blogs = await prisma.blog.findMany({ orderBy: { createdAt: "desc" } });
  res.status(200).json({ success: true, data: blogs });
});

export const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const input = blogSchema.parse(req.body);
  const blog = await prisma.blog.create({
    data: { ...input, publishedAt: input.isPublished ? new Date() : undefined },
  });
  res.status(201).json({ success: true, message: "Blog created", data: blog });
});

export const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const input = blogSchema.partial().parse(req.body);
  const blog = await prisma.blog.update({
    where: { id: req.params.id },
    data: { ...input, ...(input.isPublished ? { publishedAt: new Date() } : {}) },
  });
  res.status(200).json({ success: true, message: "Blog updated", data: blog });
});

export const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  await prisma.blog.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: "Blog deleted" });
});
