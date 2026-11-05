export function formatMoneyGHS(
    value: string | number | null | undefined,
    options?: {
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
    }
) {
    const n = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
    const safe = Number.isFinite(n) ? n : 0;

    const minimumFractionDigits = options?.minimumFractionDigits ?? 0;
    const maximumFractionDigits = options?.maximumFractionDigits ?? 2;

    const formatted = safe.toLocaleString('en-GH', {
        minimumFractionDigits,
        maximumFractionDigits,
    });

    return `₵${formatted}`;
}
