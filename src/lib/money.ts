export type MoneyParseOptions = {
  allowNegative?: boolean;
};

export const sanitizeMoneyInput = (
  raw: string,
  options: MoneyParseOptions = {},
): string => {
  const allowNegative = options.allowNegative ?? false;

  let v = (raw ?? '').toString();
  v = v.replace(/\s+/g, '');
  v = v.replace(allowNegative ? /[^0-9.,-]/g : /[^0-9.,]/g, '');

  if (allowNegative) {
    // Keep at most one leading "-"
    v = v.replace(/(?!^)-/g, '');
  }

  return v;
};

export const parseMoneyInput = (
  raw: string,
  options: MoneyParseOptions = {},
): number | null => {
  const allowNegative = options.allowNegative ?? false;
  const cleaned = sanitizeMoneyInput(raw, { allowNegative });
  if (!cleaned) return null;

  let v = cleaned;

  // If both separators exist, assume the last one is the decimal separator.
  const lastComma = v.lastIndexOf(',');
  const lastDot = v.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    const decimalSep = lastComma > lastDot ? ',' : '.';
    const thousandSep = decimalSep === ',' ? '.' : ',';

    v = v.split(thousandSep).join('');
    if (decimalSep === ',') {
      // Replace only the last comma with dot (decimal)
      const idx = v.lastIndexOf(',');
      v = v.slice(0, idx).replace(/,/g, '') + '.' + v.slice(idx + 1);
    } else {
      // Remove stray commas
      v = v.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    // Multiple commas: keep the last as decimal separator
    const parts = v.split(',');
    if (parts.length > 2) {
      v = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    } else {
      v = v.replace(',', '.');
    }
  } else if (lastDot !== -1) {
    // Multiple dots: keep the last as decimal separator
    const parts = v.split('.');
    if (parts.length > 2) {
      v = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }
  }

  // Final cleanup: allow only digits, optional leading minus, and one dot.
  v = v.replace(/[^0-9.-]/g, '');

  const dotParts = v.split('.');
  if (dotParts.length > 2) {
    v = dotParts.slice(0, -1).join('') + '.' + dotParts[dotParts.length - 1];
  }

  const n = Number.parseFloat(v);
  if (!Number.isFinite(n)) return null;
  if (!allowNegative && n < 0) return null;

  return n;
};
