export const DEFAULT_DELIVERY_FEE_MINOR = 4900;
export const DEFAULT_TAX_BASIS_POINTS = 500;

export function calculateTotals(
  items: Array<{ priceMinor: number; quantity: number }>,
  deliveryFeeMinor = DEFAULT_DELIVERY_FEE_MINOR,
  taxBasisPoints = DEFAULT_TAX_BASIS_POINTS
) {
  const subtotalMinor = items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0);
  const effectiveDeliveryFee = subtotalMinor >= 100000 ? 0 : deliveryFeeMinor;
  const taxMinor = Math.round((subtotalMinor * taxBasisPoints) / 10_000);
  return {
    subtotalMinor,
    deliveryFeeMinor: effectiveDeliveryFee,
    taxMinor,
    totalMinor: subtotalMinor + effectiveDeliveryFee + taxMinor
  };
}

export function formatMoney(minor: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(minor / 100);
}
