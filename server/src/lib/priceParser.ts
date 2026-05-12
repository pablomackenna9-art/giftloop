/**
 * Normaliza precios chilenos y extranjeros a número entero.
 * Ejemplos:
 *   "$399.990"   → 399990
 *   "399,990"    → 399990
 *   "29.990,50"  → 29990   (toma solo la parte entera)
 *   "29990"      → 29990
 *   null / ""    → null
 */
export function parsePrice(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;

  const s = String(raw).trim();
  if (!s) return null;

  // Eliminar símbolo de moneda, espacios y caracteres no numéricos excepto ., y
  const stripped = s.replace(/[^\d.,]/g, '');
  if (!stripped) return null;

  // Formato chileno: puntos como miles  "1.299.990" → 1299990
  if (/^\d{1,3}(\.\d{3})+$/.test(stripped)) {
    return parseInt(stripped.replace(/\./g, ''), 10);
  }

  // Formato con comas como miles: "1,299,990" → 1299990
  if (/^\d{1,3}(,\d{3})+$/.test(stripped)) {
    return parseInt(stripped.replace(/,/g, ''), 10);
  }

  // Formato europeo "29.990,50" — tomar solo entero
  if (/^\d+\.\d{3},\d{2}$/.test(stripped)) {
    return parseInt(stripped.replace(/\./g, '').split(',')[0], 10);
  }

  // Número simple con posible decimal
  const n = parseFloat(stripped.replace(',', '.'));
  return isNaN(n) ? null : Math.round(n);
}

/** Detecta moneda desde string crudo. Por defecto CLP. */
export function parseCurrency(raw: string | null | undefined): string {
  if (!raw) return 'CLP';
  if (raw.includes('USD') || raw.includes('$') && !raw.includes('CLP')) {
    // Si hay dígitos mayores a 99999 asumimos CLP
    const n = parsePrice(raw);
    if (n && n > 9999) return 'CLP';
    return 'USD';
  }
  return 'CLP';
}
