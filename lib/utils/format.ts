export function formatCurrency(value: number, locale: string = "es-PE", currency: string = "PEN"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string | Date, locale: string = "es-PE"): string {
  const instance = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(instance)
}
