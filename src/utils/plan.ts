import type { BudgetPlan, CatalogItem, PlanItem, StoreName } from '../types'
import { priceAt } from './pricing'

export interface RawPlan {
  summary?: unknown
  tip?: unknown
  items?: { name?: unknown; qty?: unknown; reason?: unknown }[]
}

const round2 = (n: number): number => Math.round(n * 100) / 100

/**
 * Turns a model reply into a plan the app can trust.
 * Unknown items are dropped, prices come from the catalog, quantities are clamped,
 * and items are removed from the end until the total fits the budget.
 */
export function normalizePlan(raw: RawPlan, budget: number, store: StoreName, catalog: CatalogItem[]): BudgetPlan {
  const byName = new Map(catalog.map((c) => [c.name, c]))
  const items: PlanItem[] = []
  const seen = new Set<string>()

  for (const r of Array.isArray(raw.items) ? raw.items : []) {
    const name = typeof r?.name === 'string' ? r.name : ''
    const entry = byName.get(name)
    if (!entry || seen.has(name)) continue
    seen.add(name)
    const qty = Math.min(20, Math.max(1, Math.round(Number(r.qty)) || 1))
    items.push({ name, qty, price: priceAt(entry.prices, store), reason: typeof r.reason === 'string' ? r.reason : '' })
  }

  const sum = (list: PlanItem[]): number => list.reduce((s, i) => s + i.price * i.qty, 0)
  while (items.length > 0 && sum(items) > budget) items.pop()

  const total = round2(sum(items))
  return {
    summary: typeof raw.summary === 'string' && raw.summary ? raw.summary : 'Here is a list that fits your budget.',
    tip: typeof raw.tip === 'string' ? raw.tip : '',
    items,
    total,
    leftover: round2(budget - total),
  }
}
