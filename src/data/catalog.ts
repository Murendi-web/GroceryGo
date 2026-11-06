import type { CatalogItem, CategoryName, PriceRow } from '../types'
import { BASE_PRICES } from './prices'
import { CATEGORIES } from './categories'
import { STORES } from './stores'

export const CATEGORY_NAMES = Object.keys(CATEGORIES) as CategoryName[]

/** Builds the catalog. Remote prices (from the scraper) override the baseline per item. */
export function buildCatalog(overrides: Record<string, PriceRow> = {}): CatalogItem[] {
  const items: CatalogItem[] = []
  for (const cat of CATEGORY_NAMES) {
    const { col, keys } = CATEGORIES[cat]
    for (const name of keys) {
      const base = BASE_PRICES[name] ?? []
      const live = overrides[name] ?? []
      const prices: PriceRow = STORES.map((_, i) => live[i] ?? base[i] ?? null)
      items.push({ name, cat, col, prices })
    }
  }
  return items
}

export const categoryColor = (cat: string): string =>
  (CATEGORIES as Record<string, { col: string } | undefined>)[cat]?.col ?? '#888888'
