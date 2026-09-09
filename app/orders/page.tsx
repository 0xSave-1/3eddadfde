import { Receipt } from "lucide-react"
import { ShopShell } from "@/components/shop/shell"
import { BackHeader } from "@/components/shop/back-header"
import { OrderCard } from "@/components/shop/order-card"
import { getOrdersForVisitor, getOrderWithItems } from "@/lib/data/orders"
import { getVisitorId } from "@/lib/visitor"
import { getOrderDeliveries } from "@/lib/data/delivery"

export default async function OrdersPage() {
  const visitorId = await getVisitorId()
  const orders = await getOrdersForVisitor(visitorId)
  const withItems = await Promise.all(orders.map((o) => getOrderWithItems(o.id)))
  const deliveriesByOrder = await Promise.all(
    withItems.map((record) => (record ? getOrderDeliveries(record.order.id) : Promise.resolve([]))),
  )

  return (
    <ShopShell>
      <BackHeader title="My Orders" />
      <div className="flex flex-col gap-3 px-4 pt-4">
        {withItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <Receipt className="size-10 text-muted-foreground" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          withItems.map(
            (record, i) =>
              record && (
                <OrderCard
                  key={record.order.id}
                  order={record.order}
                  items={record.items}
                  deliveries={deliveriesByOrder[i]}
                />
              ),
          )
        )}
      </div>
    </ShopShell>
  )
}
