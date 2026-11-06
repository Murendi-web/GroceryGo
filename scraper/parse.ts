/** "R 1 249.99", "R54,99" and "R54.99" all parse. */
export function parseRand(text: string): number | null {
  const m = text.match(/R\s*(\d{1,3}(?:[ \u00a0,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/)
  if (!m || !m[1]) return null
  const raw = m[1].replace(/[ \u00a0]/g, '')
  const normalised = /,\d{1,2}$/.test(raw) ? raw.replace(',', '.') : raw.replace(/,/g, '')
  const n = Number(normalised)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Rejects matches that are clearly a different product: price must be within 40% to 250% of baseline. */
export function plausible(price: number, baseline: number | null | undefined): boolean {
  if (baseline == null) return price > 0 && price < 2000
  return price >= baseline * 0.4 && price <= baseline * 2.5
}
