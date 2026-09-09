import { db } from "@/lib/db"
import { categories, products } from "@/lib/db/schema"
import { and, asc, desc, eq, ilike, or } from "drizzle-orm"

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder))
}

export async function getCategoryBySlug(slug: string) {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug))
  return rows[0] ?? null
}

export async function getProducts(options?: { categorySlug?: string; search?: string }) {
  const conditions = [eq(products.isActive, true)]

  if (options?.categorySlug && options.categorySlug !== "all") {
    const category = await getCategoryBySlug(options.categorySlug)
    if (category) conditions.push(eq(products.categoryId, category.id))
  }

  if (options?.search) {
    const term = `%${options.search}%`
    return db
      .select()
      .from(products)
      .where(and(...conditions, or(ilike(products.name, term), ilike(products.description, term))))
      .orderBy(asc(products.sortOrder))
  }

  return db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.sortOrder))
}

export async function getPopularProducts(limit = 4) {
  return db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.reviewCount))
    .limit(limit)
}

export async function getProductById(id: number) {
  const rows = await db.select().from(products).where(eq(products.id, id))
  return rows[0] ?? null
}

export async function getLatestProducts(limit = 6) {
  return db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(limit)
}

export async function getAllProductsWithCategory() {
  return db
    .select({
      id: products.id,
      name: products.name,
      priceCents: products.priceCents,
      stock: products.stock,
      isActive: products.isActive,
      badge: products.badge,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(categories.sortOrder), asc(products.sortOrder))
}

export async function getCategoriesWithProducts() {
  const cats = await getCategories()
  const all = await db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.sortOrder))
  return cats.map((c) => ({ ...c, products: all.filter((p) => p.categoryId === c.id) }))
}
