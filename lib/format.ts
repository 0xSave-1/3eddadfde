export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}

export function formatCentsShort(cents: number): string {
  const value = cents / 100
  return value % 1 === 0 ? `$${value}` : `$${value.toFixed(2)}`
}
