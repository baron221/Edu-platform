/**
 * Format a price in UZS with proper thousands separators
 * e.g. 370000 → "370 000 so'm"  or  "370 000 сум"
 */
export function formatUZS(amount: number, currencyLabel = "so'm"): string {
    if (amount === 0) return '';
    return `${amount.toLocaleString('uz-UZ')} ${currencyLabel}`;
}

/**
 * Format a short UZS price (with abbreviation for thousands)
 * e.g. 370000 → "370K so'm"
 */
export function formatUZSShort(amount: number, currencyLabel = "so'm"): string {
    if (amount === 0) return '';
    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M ${currencyLabel}`;
    }
    if (amount >= 1_000) {
        return `${Math.round(amount / 1_000)} 000 ${currencyLabel}`;
    }
    return `${amount} ${currencyLabel}`;
}
