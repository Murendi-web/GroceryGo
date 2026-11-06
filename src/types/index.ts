export type StoreName = 'Shoprite' | 'Checkers' | 'Pick n Pay' | 'SPAR' | 'Woolworths'

export type CategoryName =
  | 'Grains & Staples'
  | 'Meat & Poultry'
  | 'Fresh Produce'
  | 'Dairy & Eggs'
  | 'Pantry'
  | 'Beverages'
  | 'Snacks'
  | 'Household'

export type CategoryOrOther = CategoryName | 'Other'

/** Prices in ZAR, indexed by STORES order. null means the store does not stock the item. */
export type PriceRow = (number | null)[]

export interface CatalogItem {
  name: string
  cat: CategoryName
  col: string
  prices: PriceRow
}

/** Anything the UI can render as a product row. CatalogItem and ListItem both fit. */
export interface RowItem {
  name: string
  cat: CategoryOrOther
  col: string
  prices: PriceRow
  isCustom?: boolean
  price?: number
}

export interface ListItem {
  name: string
  cat: CategoryOrOther
  col: string
  /** Price per unit at the time the item was added. */
  price: number
  qty: number
  checked: boolean
  isCustom: boolean
  prices: PriceRow
}

export interface Special {
  item: string
  was: number
  now: number
}

export interface Meal {
  name: string
  time: string
  serves: number
  col: string
  keys: string[]
}

export interface NearbyStore {
  name: string
  addr: string
  km: string
  hours: string
}

export interface TripItem {
  name: string
  qty: number
  price: number
}

export interface Trip {
  id: string
  date: number
  store: StoreName
  total: number
  items: TripItem[]
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  isGuest: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface PlanItem {
  name: string
  qty: number
  price: number
  reason: string
}

export interface BudgetPlan {
  summary: string
  items: PlanItem[]
  total: number
  leftover: number
  tip: string
}

export type Stage = 'splash' | 'onboard' | 'auth' | 'main'
export type TabId = 'home' | 'meals' | 'list' | 'deals' | 'more'
export type SubScreen = 'chat' | 'locator' | 'favs' | 'history' | 'share' | 'profile'
export type ToastKind = 'ok' | 'remove'
