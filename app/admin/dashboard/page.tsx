import { redirect } from "next/navigation"
import Link from "next/link"
import { DollarSign, ShoppingCart, CheckCircle2, Wallet, Shield, Users, ScrollText, Palette, Bot } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { hasPermission } from "@/lib/permissions"
import { getOrderStats, getAllOrdersWithItems } from "@/lib/data/orders"
import { getAllProductsWithCategory, getCategories } from "@/lib/data/catalog"
import { getTotalUserWalletBalance } from "@/lib/data/user-wallet"
import { listPromoCodes } from "@/lib/data/promo"
import { StatCard } from "@/components/admin/stat-card"
import { AdminLogoutButton } from "@/components/admin/logout-button"
import { StatusBadge } from "@/components/shop/status-badge"
import { OrderStatusSelect } from "@/components/admin/order-status-select"
import { PromoManager } from "@/components/admin/promo-manager"
import { ProductAddForm } from "@/components/admin/product-add-form"
import { ProductRowActions } from "@/components/admin/product-row-actions"
import { TelegramCard } from "@/components/admin/telegram-card"
import { getTelegramStatus } from "@/app/actions/admin-telegram"
import { formatCents } from "@/lib/format"

export default async function AdminDashboardPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin")

  const canViewOrders = hasPermission(session.permissions, "orders.view") || hasPermission(session.permissions, "orders.manage")
  const canManageProducts = hasPermission(session.permissions, "products.manage")
  const canManagePromos = hasPermission(session.permissions, "promos.manage")
  const canManageTelegram = hasPermission(session.permissions, "telegram.manage")
  const canViewWallet = hasPermission(session.permissions, "wallet.view") || hasPermission(session.permissions, "wallet.manage")
  const canManageAdmins = hasPermission(session.permissions, "admins.manage")
  const canManageRoles = hasPermission(session.permissions, "roles.manage")
  const canViewAudit = hasPermission(session.permissions, "audit.view")
  const canManageUsers = hasPermission(session.permissions, "users.manage")
  const canManageTheme = hasPermission(session.permissions, "theme.manage")
  const canManageBots = hasPermission(session.permissions, "bots.manage")

  const [stats, orders, products, wallet, promoCodes, categories, telegramStatus] = await Promise.all([
    getOrderStats(),
    canViewOrders ? getAllOrdersWithItems(20) : Promise.resolve([]),
    canManageProducts ? getAllProductsWithCategory() : Promise.resolve([]),
    canViewWallet ? getTotalUserWalletBalance() : Promise.resolve(0),
    canManagePromos ? listPromoCodes() : Promise.resolve([]),
    getCategories(),
    canManageTelegram ? getTelegramStatus() : Promise.resolve({ botUsername: null, webhookUrl: null }),
  ])

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Nexora</p>
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{session.username}</span>
              {" · "}
              <span className="capitalize">{session.roleName}</span>
            </p>
          </div>
          <AdminLogoutButton />
        </header>

        <nav className="mt-4 flex flex-wrap gap-2">
          {canManageAdmins && (
            <Link
              href="/admin/admins"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <Users className="size-3.5" /> Admins
            </Link>
          )}
          {canManageRoles && (
            <Link
              href="/admin/roles"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <Shield className="size-3.5" /> Roles
            </Link>
          )}
          {canViewAudit && (
            <Link
              href="/admin/audit-log"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <ScrollText className="size-3.5" /> Audit Log
            </Link>
          )}
          <Link
            href="/admin/homepage"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            Homepage Builder
          </Link>
          {canManageUsers && (
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <Users className="size-3.5" /> Users
            </Link>
          )}
          {canManageTheme && (
            <Link
              href="/admin/theme"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <Palette className="size-3.5" /> Theme
            </Link>
          )}
          {canManageBots && (
            <Link
              href="/admin/bots"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <Bot className="size-3.5" /> Bots
            </Link>
          )}
        </nav>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Revenue" value={formatCents(stats.revenueCents)} icon={DollarSign} />
          <StatCard label="Total Orders" value={String(stats.totalOrders)} icon={ShoppingCart} />
          <StatCard label="Paid Orders" value={String(stats.paidOrders)} icon={CheckCircle2} />
          {canViewWallet && <StatCard label="Wallet Balance" value={formatCents(wallet)} icon={Wallet} />}
        </section>

        {canViewOrders && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Order</th>
                    <th className="px-3 py-2.5 font-medium">Items</th>
                    <th className="px-3 py-2.5 font-medium">Total</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        No orders yet.
                      </td>
                    </tr>
                  ) : (
                    orders.map(({ order, items }) => (
                      <tr key={order.id}>
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          #{order.id.toString().padStart(5, "0")}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {items.map((i) => i.productName).join(", ") || "—"}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-foreground">{formatCents(order.totalCents)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={order.paymentStatus} />
                            <OrderStatusSelect orderId={order.id} status={order.status} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {canManageTelegram && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">Telegram Bot</h2>
            <div className="mt-3">
              <TelegramCard initialBotUsername={telegramStatus.botUsername} initialWebhookUrl={telegramStatus.webhookUrl} />
            </div>
          </section>
        )}

        {canManagePromos && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">Promo Codes</h2>
            <PromoManager promoCodes={promoCodes} />
          </section>
        )}

        {canManageProducts && (
          <section className="mt-8 mb-10">
            <h2 className="text-sm font-semibold text-foreground">Products</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <ProductAddForm categories={categories} />
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Product</th>
                    <th className="px-3 py-2.5 font-medium">Category</th>
                    <th className="px-3 py-2.5 font-medium">Price</th>
                    <th className="px-3 py-2.5 font-medium">Stock</th>
                    <th className="px-3 py-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {p.name}
                        {p.badge && (
                          <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            {p.badge}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.categoryName}</td>
                      <td className="px-3 py-2.5 text-foreground">{formatCents(p.priceCents)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.stock}</td>
                      <td className="px-3 py-2.5">
                        <ProductRowActions id={p.id} name={p.name} isActive={p.isActive} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
