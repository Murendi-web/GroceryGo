export const isValidEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/** Accepts 0821234567, 082 123 4567, +27 82 123 4567 and 27821234567. */
export function isValidSaPhone(v: string): boolean {
  const digits = v.replace(/[^\d]/g, '')
  if (digits.startsWith('27')) return digits.length === 11
  return digits.startsWith('0') && digits.length === 10
}
