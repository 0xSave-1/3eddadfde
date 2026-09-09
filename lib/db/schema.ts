import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull().default("sparkles"),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  compareAtPriceCents: integer("compare_at_price_cents"),
  imageUrl: text("image_url").notNull().default(""),
  badge: text("badge"),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull().default("4.8"),
  reviewCount: integer("review_count").notNull().default(0),
  stock: integer("stock").notNull().default(999),
  sku: text("sku").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paymentMethod: text("payment_method").notNull().default("card"),
  subtotalCents: integer("subtotal_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  walletAppliedCents: integer("wallet_applied_cents").notNull().default(0),
  stripeSessionId: text("stripe_session_id"),
  promoCode: text("promo_code"),
  visitorId: text("visitor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
})

export const wallet = pgTable("wallet", {
  id: serial("id").primaryKey(),
  balanceCents: integer("balance_cents").notNull().default(0),
})

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  amountCents: integer("amount_cents").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("completed"),
  stripeSessionId: text("stripe_session_id"),
  visitorId: text("visitor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull().default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const telegramUsers = pgTable("telegram_users", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull().unique(),
  telegramId: text("telegram_id").unique(),
  username: text("username"),
  referralCode: text("referral_code").notNull().unique(),
  referredByCode: text("referred_by_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const referralRewards = pgTable("referral_rewards", {
  id: serial("id").primaryKey(),
  referrerVisitorId: text("referrer_visitor_id").notNull(),
  refereeVisitorId: text("referee_visitor_id").notNull(),
  rewardCents: integer("reward_cents").notNull(),
  status: text("status").notNull().default("pending"),
  orderId: integer("order_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const adminRoles = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isSystem: boolean("is_system").notNull().default(false),
  permissions: jsonb("permissions").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  roleId: integer("role_id").notNull(),
  telegramId: text("telegram_id").unique(),
  isOwner: boolean("is_owner").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
})

export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id"),
  actorUsername: text("actor_username").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const homepageBlocks = pgTable("homepage_blocks", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  config: jsonb("config").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const productDeliveryContent = pgTable("product_delivery_content", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().unique(),
  content: text("content").notNull().default(""),
  deliveryMode: text("delivery_mode").notNull().default("shared"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const productDeliveryStock = pgTable("product_delivery_stock", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  value: text("value").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  orderId: integer("order_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const orderDeliveries = pgTable("order_deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const themeSettings = pgTable("theme_settings", {
  id: serial("id").primaryKey(),
  tokens: jsonb("tokens").notNull().default({}),
  fontSans: text("font_sans").notNull().default("Geist"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const botInstances = pgTable("bot_instances", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  botToken: text("bot_token").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const userWallets = pgTable("user_wallets", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull().unique(),
  balanceCents: integer("balance_cents").notNull().default(0),
  isBanned: boolean("is_banned").notNull().default(false),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
