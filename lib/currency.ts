/**
 * Centralized currency and price formatting for Nigerian Market (NGN / ₦)
 */

export const DEFAULT_CURRENCY_SYMBOL = '₦';
export const DEFAULT_CURRENCY_CODE = 'NGN';

export function formatPrice(
  amount: number | string | undefined | null,
  symbol: string = DEFAULT_CURRENCY_SYMBOL
): string {
  if (amount === undefined || amount === null || amount === '') {
    return `${symbol}0`;
  }
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) {
    return `${symbol}0`;
  }

  // Format with thousands separator: e.g. ₦35,000 or ₦35,000.00
  const formatted = num.toLocaleString('en-NG', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatted}`;
}

export function formatNaira(amount: number | string | undefined | null): string {
  return formatPrice(amount, DEFAULT_CURRENCY_SYMBOL);
}
