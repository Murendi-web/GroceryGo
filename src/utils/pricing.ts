import type { PriceRow, StoreName } from '../types'
import { STORES, STORE_INDEX } from '../data/stores'

export function priceAt(row: PriceRow, store: StoreName): number {
  const p = row[STORE_INDEX[store]]
  if (p != null) return p
  return row.find((x): x is number => x != null) ?? 0
}

export function lowestPrice(row: PriceRow): number {
  const all = row.filter((x): x is number => x != null)
  return all.length ? Math.min(...all) : 0
}

export function cheapestStore(row: PriceRow): StoreName | null {
  let best: StoreName | null = null
  let bestPrice = Infinity
  STORES.forEach((s, i) => {
    const p = row[i]
    if (p != null && p < bestPrice) {
      bestPrice = p
      best = s
    }
  })
  return best
}

/** Parses JSON from a model reply, tolerating markdown code fences. */
export function parseModelJson<T>(raw: string): T {
  return JSON.parse(raw.replace(/```json|```/g, '').trim()) as T
}
