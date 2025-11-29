export type PersonalTokenExpiryPreset =
  | '1_week'
  | '1_month'
  | '3_months'
  | '6_months'
  | '1_year';

export const PERSONAL_TOKEN_EXPIRY_PRESETS: readonly PersonalTokenExpiryPreset[] = [
  '1_week',
  '1_month',
  '3_months',
  '6_months',
  '1_year',
] as const;

export const DEFAULT_PERSONAL_TOKEN_EXPIRY_PRESET: PersonalTokenExpiryPreset = '3_months';

// Centraliza el cálculo de expiración basado en preset; sin valores hardcodeados en el servicio
export function computeExpiresAtFromPreset(
  preset?: PersonalTokenExpiryPreset | null,
  now: Date = new Date()
): Date {
  const p = preset ?? DEFAULT_PERSONAL_TOKEN_EXPIRY_PRESET;
  const d = new Date(now.getTime());
  switch (p) {
    case '1_week':
      d.setDate(d.getDate() + 7);
      return d;
    case '1_month':
      d.setMonth(d.getMonth() + 1);
      return d;
    case '3_months':
      d.setMonth(d.getMonth() + 3);
      return d;
    case '6_months':
      d.setMonth(d.getMonth() + 6);
      return d;
    case '1_year':
      d.setFullYear(d.getFullYear() + 1);
      return d;
    default:
      // Fallback robusto a preset por defecto si se recibe uno desconocido
      const def = DEFAULT_PERSONAL_TOKEN_EXPIRY_PRESET;
      switch (def) {
        case '1_week':
          d.setDate(d.getDate() + 7);
          return d;
        case '1_month':
          d.setMonth(d.getMonth() + 1);
          return d;
        case '3_months':
          d.setMonth(d.getMonth() + 3);
          return d;
        case '6_months':
          d.setMonth(d.getMonth() + 6);
          return d;
        case '1_year':
          d.setFullYear(d.getFullYear() + 1);
          return d;
      }
  }
}