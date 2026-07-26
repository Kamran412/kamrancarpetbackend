import { z } from "zod";

export const productSizeSchema = z.object({
  label: z.string().min(1),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  priceDiff: z.number().default(0),
  stock: z.number().int().nonnegative().default(0),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, alphanumeric, hyphenated"),
  sku: z.string().min(1).max(64),
  description: z.string().min(10),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  material: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  color: z.string().optional(),
  shape: z.string().optional(),
  thickness: z.string().optional(),
  weight: z.string().optional(),
  availableSizes: z.array(productSizeSchema).optional(),
  customSizeAllowed: z.boolean().default(false),
  price: z.number().positive(),
  salePrice: z.number().positive().optional(),
  currency: z.string().default("USD"),
  stock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  tags: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isTodayDeal: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  collection: z.string().optional(),
  material: z.string().optional(), // comma-separated for multi-select, e.g. "Wool,Silk"
  color: z.string().optional(), // comma-separated for multi-select
  shape: z.string().optional(), // comma-separated for multi-select
  country: z.string().optional(), // comma-separated for multi-select
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  size: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating", "best_selling"]).default("newest"),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
