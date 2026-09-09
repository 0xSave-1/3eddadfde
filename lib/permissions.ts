export const PERMISSIONS = [
  "products.manage",
  "orders.manage",
  "orders.view",
  "orders.update_status",
  "promos.manage",
  "wallet.manage",
  "wallet.view",
  "telegram.manage",
  "homepage.manage",
  "users.manage",
  "theme.manage",
  "bots.manage",
  "delivery.manage",
  "admins.manage",
  "roles.manage",
  "audit.view",
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const PERMISSION_LABELS: Record<Permission, string> = {
  "products.manage": "Manage products",
  "orders.manage": "Manage orders (full)",
  "orders.view": "View orders",
  "orders.update_status": "Update order status",
  "promos.manage": "Manage promo codes",
  "wallet.manage": "Manage wallet & transactions",
  "wallet.view": "View wallet",
  "telegram.manage": "Manage Telegram bot",
  "homepage.manage": "Manage homepage builder",
  "admins.manage": "Manage admin accounts",
  "roles.manage": "Manage roles & permissions",
  "audit.view": "View audit log",
  "theme.manage": "Manage storefront theme",
  "users.manage": "Manage user registry & balances",
  "bots.manage": "Manage Telegram bot mirrors",
  "delivery.manage": "Manage product delivery content",
}

export function hasPermission(permissions: string[], required: Permission): boolean {
  return permissions.includes("*") || permissions.includes(required)
}
