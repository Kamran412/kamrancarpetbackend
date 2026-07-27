import prisma from "@/config/prisma";
import { ApiError } from "@/utils/ApiError";
import { CreateProductInput, ProductQueryInput, UpdateProductInput } from "@/validators/product.validator";
import { Prisma, ProductStatus } from "@prisma/client";

/** Builds a case-insensitive "matches any of these values" filter from a comma-separated query param. */
function multiValueFilter(field: string, raw?: string): Prisma.ProductWhereInput | Record<string, never> {
  if (!raw) return {};
  const values = raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!values.length) return {};
  return { [field]: { in: values, mode: "insensitive" } } as Prisma.ProductWhereInput;
}

export async function listProducts(query: ProductQueryInput) {
  const { page, limit, search, category, collection, material, color, shape, country, minPrice, maxPrice, size, inStock, sort, status } =
    query;

  const where: Prisma.ProductWhereInput = {
    ...(status === "ALL" ? {} : status ? { status } : { status: ProductStatus.PUBLISHED }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { tags: { has: search.toLowerCase() } },
          ],
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(collection ? { collection: { slug: collection } } : {}),
    ...multiValueFilter("material", material),
    ...multiValueFilter("color", color),
    ...multiValueFilter("shape", shape),
    ...multiValueFilter("countryOfOrigin", country),
    ...(size ? { availableSizes: { some: { label: { equals: size, mode: "insensitive" } } } } : {}),
    ...(inStock ? { stock: { gt: 0 } } : {}),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice ? { gte: minPrice } : {}),
            ...(maxPrice ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : sort === "rating"
      ? { ratingAverage: "desc" }
      : sort === "best_selling"
      ? { isBestSeller: "desc" }
      : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true, collection: true, brand: true, gallery: true, availableSizes: true },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      collection: true,
      brand: true,
      gallery: { orderBy: { position: "asc" } },
      availableSizes: true,
      reviews: { where: { status: "APPROVED" }, include: { user: { select: { name: true, avatarUrl: true } } } },
    },
  });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      collection: true,
      brand: true,
      gallery: { orderBy: { position: "asc" } },
      availableSizes: true,
    },
  });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function createProduct(input: CreateProductInput) {
  const existingSku = await prisma.product.findUnique({ where: { sku: input.sku } });
  if (existingSku) throw ApiError.conflict("A product with this SKU already exists");

  const existingSlug = await prisma.product.findUnique({ where: { slug: input.slug } });
  if (existingSlug) throw ApiError.conflict("A product with this slug already exists");

  const { availableSizes, ...rest } = input;

  return prisma.product.create({
    data: {
      ...rest,
      ...(availableSizes?.length ? { availableSizes: { create: availableSizes } } : {}),
    },
    include: { availableSizes: true },
  });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Product not found");

  const { availableSizes, ...rest } = input;

  return prisma.product.update({
    where: { id },
    data: {
      ...rest,
      ...(availableSizes
        ? {
            availableSizes: {
              deleteMany: {},
              create: availableSizes,
            },
          }
        : {}),
    },
    include: { availableSizes: true, gallery: true },
  });
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Product not found");
  await prisma.product.delete({ where: { id } });
}

export async function bulkDeleteProducts(ids: string[]) {
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
}

export async function duplicateProduct(id: string) {
  const original = await prisma.product.findUnique({
    where: { id },
    include: { availableSizes: true, gallery: true },
  });
  if (!original) throw ApiError.notFound("Product not found");

  const timestamp = Date.now();
  return prisma.product.create({
    data: {
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${timestamp}`,
      sku: `${original.sku}-COPY-${timestamp}`,
      description: original.description,
      shortDescription: original.shortDescription,
      categoryId: original.categoryId,
      collectionId: original.collectionId,
      brandId: original.brandId,
      material: original.material,
      countryOfOrigin: original.countryOfOrigin,
      color: original.color,
      shape: original.shape,
      thickness: original.thickness,
      weight: original.weight,
      customSizeAllowed: original.customSizeAllowed,
      price: original.price,
      salePrice: original.salePrice,
      currency: original.currency,
      stock: 0,
      tags: original.tags,
      status: ProductStatus.DRAFT,
      availableSizes: {
        create: original.availableSizes.map(({ label, widthCm, heightCm, priceDiff, stock }) => ({
          label,
          widthCm,
          heightCm,
          priceDiff,
          stock,
        })),
      },
    },
  });
}