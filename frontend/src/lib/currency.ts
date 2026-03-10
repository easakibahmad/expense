/** Bangladeshi Taka (BDT) symbol */
export const CURRENCY_SYMBOL = '৳'

export function formatAmount(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`
}
