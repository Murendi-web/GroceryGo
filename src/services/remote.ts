import type { CatalogItem, ListItem, PriceRow, StoreName, Trip, TripItem } from '../types'
import { STORES } from '../data/stores'
import { categoryColor } from '../data/catalog'
import { supabase } from './supabase'

interface ListItemRow {
  name: string
  category: string
  price: number
  qty: number
  checked: boolean
  is_custom: boolean
}

interface TripRow {
  id: string
  created_at: string
  store: StoreName
  total: number
  items: TripItem[]
}

export async function fetchActiveList(
  userId: string,
  catalog: CatalogItem[],
): Promise<{ listId: string; items: ListItem[] } | null> {
  if (!supabase) return null
  const found = await supabase
    .from('lists')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (found.error) return null

  let listId = (found.data?.[0] as { id: string } | undefined)?.id
  if (!listId) {
    const created = await supabase.from('lists').insert({ user_id: userId, name: 'My List' }).select('id').single()
    if (created.error || !created.data) return null
    listId = (created.data as { id: string }).id
  }

  const rows = await supabase.from('list_items').select('name, category, price, qty, checked, is_custom').eq('list_id', listId)
  if (rows.error) return null
  const byName = new Map(catalog.map((c) => [c.name, c]))
  const items = (rows.data as ListItemRow[]).map<ListItem>((r) => {
    const entry = byName.get(r.name)
    return {
      name: r.name,
      cat: (entry?.cat ?? r.category) as ListItem['cat'],
      col: entry?.col ?? categoryColor(r.category),
      price: Number(r.price),
      qty: r.qty,
      checked: r.checked,
      isCustom: r.is_custom,
      prices: entry?.prices ?? [],
    }
  })
  return { listId, items }
}

/** Upserts current items and removes the ones the user deleted. Not atomic. */
export async function syncListItems(listId: string, items: ListItem[]): Promise<void> {
  if (!supabase) return
  const existing = await supabase.from('list_items').select('name').eq('list_id', listId)
  if (existing.error) return
  const keep = new Set(items.map((i) => i.name))
  const removed = (existing.data as { name: string }[]).map((r) => r.name).filter((n) => !keep.has(n))
  if (removed.length > 0) await supabase.from('list_items').delete().eq('list_id', listId).in('name', removed)
  if (items.length > 0) {
    await supabase.from('list_items').upsert(
      items.map((i) => ({
        list_id: listId,
        name: i.name,
        category: i.cat,
        price: i.price,
        qty: i.qty,
        checked: i.checked,
        is_custom: i.isCustom,
      })),
      { onConflict: 'list_id,name' },
    )
  }
}

export async function fetchFavourites(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('favourites').select('item_name').eq('user_id', userId)
  return error || !data ? [] : (data as { item_name: string }[]).map((r) => r.item_name)
}

export async function setFavourite(userId: string, name: string, on: boolean): Promise<void> {
  if (!supabase) return
  if (on) await supabase.from('favourites').upsert({ user_id: userId, item_name: name }, { onConflict: 'user_id,item_name' })
  else await supabase.from('favourites').delete().eq('user_id', userId).eq('item_name', name)
}

export async function fetchTrips(userId: string): Promise<Trip[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('shopping_history')
    .select('id, created_at, store, total, items')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(15)
  if (error || !data) return []
  return (data as TripRow[]).map((r) => ({
    id: r.id,
    date: new Date(r.created_at).getTime(),
    store: r.store,
    total: Number(r.total),
    items: r.items,
  }))
}

export async function insertTrip(userId: string, trip: Trip): Promise<void> {
  if (!supabase) return
  await supabase.from('shopping_history').insert({
    user_id: userId,
    store: trip.store,
    total: trip.total,
    item_count: trip.items.length,
    items: trip.items,
  })
}

/** Latest scraped prices, one row per item. Empty when the scraper has not run yet. */
export async function fetchRemotePrices(maxAgeDays = 14): Promise<Record<string, PriceRow>> {
  if (!supabase) return {}
  const since = new Date(Date.now() - maxAgeDays * 86_400_000).toISOString()
  const { data, error } = await supabase
    .from('prices')
    .select('item_name, store, price')
    .eq('is_valid', true)
    .gte('scraped_at', since)
  if (error || !data) return {}
  const out: Record<string, PriceRow> = {}
  for (const row of data as { item_name: string; store: StoreName; price: number }[]) {
    const idx = STORES.indexOf(row.store)
    if (idx < 0) continue
    const prices = (out[row.item_name] ??= STORES.map(() => null))
    prices[idx] = Number(row.price)
  }
  return out
}
