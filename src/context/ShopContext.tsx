import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type {
  CatalogItem,
  CategoryOrOther,
  ListItem,
  Meal,
  PlanItem,
  RowItem,
  StoreName,
  ToastKind,
  Trip,
} from '../types'
import { buildCatalog, categoryColor } from '../data/catalog'
import { priceAt } from '../utils/pricing'
import { clearCollected } from '../utils/list'
import { useAuth } from './AuthContext'
import { KEYS, loadJson, saveJson } from '../services/storage'
import { isSupabaseConfigured } from '../services/supabase'
import {
  fetchActiveList,
  fetchFavourites,
  fetchRemotePrices,
  fetchTrips,
  insertTrip,
  setFavourite,
  syncListItems,
} from '../services/remote'

interface PersistedShop {
  list: ListItem[]
  favs: string[]
  history: Trip[]
  store: StoreName
  budget: string
}

interface ToastState {
  msg: string
  kind: ToastKind
}

interface ShopValue {
  catalog: CatalogItem[]
  store: StoreName
  setStore: (s: StoreName) => void
  budget: string
  setBudget: (v: string) => void
  list: ListItem[]
  favs: string[]
  history: Trip[]
  total: number
  budgetNum: number
  overBudget: boolean
  doneCount: number
  progress: number
  toast: ToastState | null
  showToast: (msg: string, kind?: ToastKind) => void
  inList: (name: string) => boolean
  toggleItem: (item: RowItem, priceOverride?: number) => void
  addMeal: (meal: Meal) => void
  addPlanItems: (items: PlanItem[]) => number
  addCustomItem: (input: { name: string; cat: CategoryOrOther; price: number }) => boolean
  toggleChecked: (name: string) => void
  setQty: (name: string, qty: number) => void
  removeItem: (name: string) => void
  clearDone: () => void
  toggleFav: (name: string) => void
  saveTrip: () => void
  restoreTrip: (trip: Trip) => void
}

const ShopContext = createContext<ShopValue | null>(null)

const EMPTY: PersistedShop = { list: [], favs: [], history: [], store: 'Checkers', budget: '' }

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { user, demoMode } = useAuth()
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => buildCatalog())
  const [store, setStoreState] = useState<StoreName>('Checkers')
  const [budget, setBudget] = useState('')
  const [list, setList] = useState<ListItem[]>([])
  const [favs, setFavs] = useState<string[]>([])
  const [history, setHistory] = useState<Trip[]>([])
  const [toast, setToast] = useState<ToastState | null>(null)
  const [hydratedFor, setHydratedFor] = useState<string | null>(null)
  const listIdRef = useRef<string | null>(null)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const catalogRef = useRef(catalog)
  catalogRef.current = catalog

  const userId = user?.id ?? null

  /** Switching store reprices catalog items. Custom items keep the price the user set. */
  const setStore = useCallback((next: StoreName) => {
    setStoreState(next)
    setList((prev) => prev.map((i) => (i.isCustom ? i : { ...i, price: priceAt(i.prices, next) })))
  }, [])

  const showToast = useCallback((msg: string, kind: ToastKind = 'ok') => {
    setToast({ msg, kind })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  // Live prices from the scraper, when available.
  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return
    let active = true
    fetchRemotePrices().then((remote) => {
      if (active && Object.keys(remote).length > 0) setCatalog(buildCatalog(remote))
    })
    return () => {
      active = false
    }
  }, [userId])

  // Load the signed-in user's data: device cache first, then the server copy.
  useEffect(() => {
    setHydratedFor(null)
    listIdRef.current = null
    if (!userId) {
      setList(EMPTY.list)
      setFavs(EMPTY.favs)
      setHistory(EMPTY.history)
      setStoreState(EMPTY.store)
      setBudget(EMPTY.budget)
      return
    }
    let active = true
    ;(async () => {
      const local = await loadJson<PersistedShop>(KEYS.shop(userId), EMPTY)
      if (!active) return
      setList(local.list)
      setFavs(local.favs)
      setHistory(local.history)
      setStoreState(local.store)
      setBudget(local.budget)
      if (isSupabaseConfigured && !demoMode) {
        const [remoteList, remoteFavs, remoteTrips] = await Promise.all([
          fetchActiveList(userId, catalogRef.current),
          fetchFavourites(userId),
          fetchTrips(userId),
        ])
        if (!active) return
        if (remoteList) {
          listIdRef.current = remoteList.listId
          setList(remoteList.items)
        }
        setFavs(remoteFavs)
        setHistory(remoteTrips)
      }
      setHydratedFor(userId)
    })()
    return () => {
      active = false
    }
  }, [userId, demoMode])

  // Device cache.
  useEffect(() => {
    if (!userId || hydratedFor !== userId) return
    saveJson(KEYS.shop(userId), { list, favs, history, store, budget } satisfies PersistedShop)
  }, [userId, hydratedFor, list, favs, history, store, budget])

  // Server sync for the list, debounced.
  useEffect(() => {
    if (!userId || hydratedFor !== userId || !listIdRef.current) return
    if (syncTimer.current) clearTimeout(syncTimer.current)
    const listId = listIdRef.current
    syncTimer.current = setTimeout(() => {
      syncListItems(listId, list).catch(() => showToast('Could not sync your list', 'remove'))
    }, 1200)
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current)
    }
  }, [list, userId, hydratedFor, showToast])

  const total = useMemo(() => list.reduce((s, i) => s + i.price * i.qty, 0), [list])
  const budgetNum = parseFloat(budget) || 0
  const doneCount = list.filter((i) => i.checked).length

  const makeListItem = useCallback(
    (item: RowItem, priceOverride?: number): ListItem => ({
      name: item.name,
      cat: item.cat,
      col: item.col,
      price: priceOverride ?? (item.isCustom ? item.price ?? 0 : priceAt(item.prices, store)),
      qty: 1,
      checked: false,
      isCustom: Boolean(item.isCustom),
      prices: item.prices,
    }),
    [store],
  )

  const inList = useCallback((name: string) => list.some((i) => i.name === name), [list])

  const toggleItem = useCallback<ShopValue['toggleItem']>(
    (item, priceOverride) => {
      if (list.some((i) => i.name === item.name)) {
        setList((prev) => prev.filter((i) => i.name !== item.name))
        showToast('Removed from list', 'remove')
      } else {
        setList((prev) => [...prev, makeListItem(item, priceOverride)])
        showToast('Added to list')
      }
    },
    [list, makeListItem, showToast],
  )

  const addMeal = useCallback<ShopValue['addMeal']>(
    (meal) => {
      const have = new Set(list.map((i) => i.name))
      const fresh = meal.keys
        .map((k) => catalog.find((c) => c.name === k))
        .filter((c): c is CatalogItem => c != null && !have.has(c.name))
        .map((c) => makeListItem(c))
      setList((prev) => [...prev, ...fresh])
      showToast(`${meal.name} added to list`)
    },
    [list, catalog, makeListItem, showToast],
  )

  const addPlanItems = useCallback<ShopValue['addPlanItems']>(
    (items) => {
      const have = new Set(list.map((i) => i.name))
      const fresh: ListItem[] = []
      for (const it of items) {
        const entry = catalog.find((c) => c.name === it.name)
        if (!entry || have.has(it.name)) continue
        fresh.push({ ...makeListItem(entry, it.price), qty: it.qty })
      }
      setList((prev) => [...prev, ...fresh])
      showToast(`${fresh.length} items added to your list`)
      return fresh.length
    },
    [list, catalog, makeListItem, showToast],
  )

  const addCustomItem = useCallback<ShopValue['addCustomItem']>(
    ({ name, cat, price }) => {
      const clean = name.trim()
      if (!clean) return false
      if (list.some((i) => i.name === clean)) {
        showToast('Already in your list', 'remove')
        return false
      }
      setList((prev) => [
        ...prev,
        { name: clean, cat, col: categoryColor(cat), price, qty: 1, checked: false, isCustom: true, prices: [] },
      ])
      showToast(`${clean} added`)
      return true
    },
    [list, showToast],
  )

  const toggleChecked = useCallback((name: string) => {
    setList((prev) => prev.map((i) => (i.name === name ? { ...i, checked: !i.checked } : i)))
  }, [])

  const setQty = useCallback((name: string, qty: number) => {
    const safe = Math.min(99, Math.max(1, Math.round(qty) || 1))
    setList((prev) => prev.map((i) => (i.name === name ? { ...i, qty: safe } : i)))
  }, [])

  const removeItem = useCallback((name: string) => {
    setList((prev) => prev.filter((i) => i.name !== name))
  }, [])

  /**
   * Removes collected items. If that finishes the whole list, the budget resets to 0.00
   * so the next shop starts fresh. A budget set before any items are added is left alone.
   */
  const clearDone = useCallback(() => {
    const { finished } = clearCollected(list)
    setList((prev) => clearCollected(prev).remaining)
    if (finished) {
      setBudget('')
      showToast('List complete. Budget reset to R 0.00')
    } else {
      showToast('Collected items cleared')
    }
  }, [list, showToast])

  const toggleFav = useCallback(
    (name: string) => {
      const on = !favs.includes(name)
      setFavs((prev) => (on ? [...prev, name] : prev.filter((f) => f !== name)))
      if (userId && isSupabaseConfigured && !demoMode) setFavourite(userId, name, on).catch(() => undefined)
    },
    [favs, userId, demoMode],
  )

  const saveTrip = useCallback(() => {
    if (list.length === 0) {
      showToast('Your list is empty', 'remove')
      return
    }
    const trip: Trip = {
      id: `${Date.now()}`,
      date: Date.now(),
      store,
      total,
      items: list.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    }
    setHistory((prev) => [trip, ...prev].slice(0, 15))
    if (userId && isSupabaseConfigured && !demoMode) insertTrip(userId, trip).catch(() => undefined)
    showToast('Trip saved to history')
  }, [list, store, total, userId, demoMode, showToast])

  const restoreTrip = useCallback(
    (trip: Trip) => {
      const have = new Set(list.map((i) => i.name))
      const fresh: ListItem[] = []
      for (const t of trip.items) {
        if (have.has(t.name)) continue
        const entry = catalog.find((c) => c.name === t.name)
        const base: RowItem = entry ?? { name: t.name, cat: 'Other', col: categoryColor('Other'), prices: [], isCustom: true }
        fresh.push({ ...makeListItem(base, t.price), qty: t.qty })
      }
      setList((prev) => [...prev, ...fresh])
      showToast('List restored')
    },
    [list, catalog, makeListItem, showToast],
  )

  const value = useMemo<ShopValue>(
    () => ({
      catalog,
      store,
      setStore,
      budget,
      setBudget,
      list,
      favs,
      history,
      total,
      budgetNum,
      overBudget: budgetNum > 0 && total > budgetNum,
      doneCount,
      progress: list.length > 0 ? (doneCount / list.length) * 100 : 0,
      toast,
      showToast,
      inList,
      toggleItem,
      addMeal,
      addPlanItems,
      addCustomItem,
      toggleChecked,
      setQty,
      removeItem,
      clearDone,
      toggleFav,
      saveTrip,
      restoreTrip,
    }),
    [
      catalog, store, budget, list, favs, history, total, budgetNum, doneCount, toast, showToast, inList,
      toggleItem, addMeal, addPlanItems, addCustomItem, toggleChecked, setQty, removeItem, clearDone,
      toggleFav, saveTrip, restoreTrip,
    ],
  )
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopValue {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used inside ShopProvider')
  return ctx
}