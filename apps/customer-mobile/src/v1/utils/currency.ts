/**
 * Currency Utility for ParcelHub V1 Mobile App
 */

export const parseCurrency = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isFinite(val) ? val : 0;
  const clean = String(val).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
};

export const formatCurrency = (val: number | string): string => {
  const num = typeof val === 'number' ? val : parseCurrency(val);
  return `₱${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
