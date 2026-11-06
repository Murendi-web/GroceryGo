import type { BudgetPlan, CatalogItem, CategoryOrOther, ChatMessage, ListItem, StoreName } from '../types'
import { CATEGORY_NAMES } from '../data/catalog'
import { askAI, type AIResult } from './ai'
import { parseModelJson, priceAt } from '../utils/pricing'
import { rand } from '../utils/format'
import { normalizePlan, type RawPlan } from '../utils/plan'

export interface ShopSnapshot {
  store: StoreName
  list: ListItem[]
  budget: number
  total: number
}

export function chatReply(history: ChatMessage[], shop: ShopSnapshot): Promise<AIResult> {
  const system =
    `You are GroceryGo, a South African grocery assistant. Store: ${shop.store}. ` +
    `List: ${shop.list.map((i) => `${i.name} x${i.qty}`).join(', ') || 'empty'}. ` +
    `Budget: ${shop.budget > 0 ? rand(shop.budget) : 'not set'}. List total: ${rand(shop.total)}. ` +
    'Be brief and practical. Reply in Afrikaans if the user writes in Afrikaans.'
  return askAI(history, system)
}

export interface PriceEstimate {
  price: number
  category: CategoryOrOther
}

export async function estimatePrice(name: string, store: StoreName): Promise<PriceEstimate> {
  const system =
    'You estimate South African grocery prices. Reply with JSON only: {"price": number, "category": string}. ' +
    `category must be one of: ${[...CATEGORY_NAMES, 'Other'].join(', ')}.`
  const { reply } = await askAI(
    [{ role: 'user', content: `Store: ${store}. Item: "${name}". Estimate the current retail price in ZAR.` }],
    system,
  )
  const parsed = parseModelJson<{ price?: unknown; category?: unknown }>(reply)
  const price = Number(parsed.price)
  if (!Number.isFinite(price) || price <= 0 || price > 10000) throw new Error('Bad price estimate')
  const category = CATEGORY_NAMES.find((c) => c === parsed.category) ?? 'Other'
  return { price: Math.round(price * 100) / 100, category }
}

export async function suggestItems(shop: ShopSnapshot, catalog: CatalogItem[]): Promise<string[]> {
  const inList = new Set(shop.list.map((i) => i.name))
  const system = 'Reply with a JSON array of exactly 8 item names and nothing else.'
  const { reply } = await askAI(
    [
      {
        role: 'user',
        content:
          `Store: ${shop.store}. Budget: ${shop.budget > 0 ? rand(shop.budget) : 'R400'}. ` +
          `Already in list: ${[...inList].join(', ') || 'nothing'}. ` +
          `Pick 8 useful items not in the list, only from: ${catalog.map((c) => c.name).join(', ')}.`,
      },
    ],
    system,
  )
  const names = parseModelJson<unknown[]>(reply)
  const valid = new Set(catalog.map((c) => c.name))
  return names.filter((n): n is string => typeof n === 'string' && valid.has(n) && !inList.has(n))
}

/**
 * Asks the model for a plan, then rebuilds every number locally from catalog prices.
 * The model picks items and quantities. It does not get to do the arithmetic.
 */
export async function buildBudgetPlan(args: {
  budget: number
  people: string
  prefs: string
  store: StoreName
  catalog: CatalogItem[]
}): Promise<BudgetPlan> {
  const { budget, people, prefs, store, catalog } = args
  const menu = catalog.map((c) => `${c.name} @ ${rand(priceAt(c.prices, store))}`).join(', ')
  const system =
    `You plan South African grocery shops at ${store}. Reply with JSON only: ` +
    '{"summary": string, "tip": string, "items": [{"name": string, "qty": number, "reason": string}]}. ' +
    `Use only these items and prices: ${menu}. Stay under R${budget}. Plan for ${people} people.`
  const { reply } = await askAI(
    [{ role: 'user', content: `Budget R${budget}. People: ${people}. Preferences: ${prefs || 'none'}.` }],
    system,
  )
  return normalizePlan(parseModelJson<RawPlan>(reply), budget, store, catalog)
}
