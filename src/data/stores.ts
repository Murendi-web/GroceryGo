import type { StoreName } from '../types'

export const STORES: StoreName[] = ['Shoprite', 'Checkers', 'Pick n Pay', 'SPAR', 'Woolworths']

export const STORE_INDEX: Record<StoreName, number> = {
  Shoprite: 0,
  Checkers: 1,
  'Pick n Pay': 2,
  SPAR: 3,
  Woolworths: 4,
}

export const STORE_COLORS: Record<StoreName, string> = {
  Shoprite: '#C62828',
  Checkers: '#1565C0',
  'Pick n Pay': '#C62828',
  SPAR: '#2E7D32',
  Woolworths: '#4A148C',
}

/** Cheapest to priciest, shown on the Home screen. */
export const PRICE_RANKING: StoreName[] = ['Shoprite', 'Checkers', 'SPAR', 'Pick n Pay', 'Woolworths']

export const STORE_TIPS: Record<StoreName, string> = {
  Shoprite: 'Cheapest overall basket in SA. Best for bulk staples like maize meal, rice and oil.',
  Checkers: 'Sixty60 delivers in 60 minutes at in-store prices. Xtra Savings card is worth activating.',
  'Pick n Pay': 'No Name brand saves 15-20% vs branded. Smart Shopper points add up fast.',
  SPAR: 'Great for top-up shops. Prices vary by franchise owner.',
  Woolworths: 'Premium quality throughout. Fresh produce marked down after 17:00 daily.',
}

export const COMPARE_ITEMS = [
  'Chicken Portions 1kg',
  'Full Cream Milk 2L',
  'Nulaid Eggs x18',
  'Ace Maize Meal 5kg',
  'Beef Mince per kg',
]
