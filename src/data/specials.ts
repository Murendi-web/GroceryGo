import type { Special, StoreName } from '../types'

export const SPECIALS: Record<StoreName, Special[]> = {
  "Shoprite": [
    { item: "Chicken Portions 1kg", was: 59.99, now: 44.99 },
    { item: "Ace Maize Meal 5kg", was: 52.99, now: 42.99 },
    { item: "Sunflower Oil 2L", was: 44.99, now: 36.99 },
    { item: "Sasko Brown Bread 700g", was: 17.99, now: 13.99 },
  ],
  "Checkers": [
    { item: "Full Cream Milk 2L", was: 35.99, now: 27.99 },
    { item: "Chicken Portions 1kg", was: 69.99, now: 54.99 },
    { item: "Nulaid Eggs x18", was: 59.99, now: 49.99 },
    { item: "Albany White Bread 700g", was: 19.99, now: 15.99 },
  ],
  "Pick n Pay": [
    { item: "Nulaid Eggs x18", was: 62.99, now: 49.99 },
    { item: "Tastic Rice 2kg", was: 46.99, now: 37.99 },
    { item: "Sunflower Oil 2L", was: 52.99, now: 42.99 },
  ],
  "SPAR": [
    { item: "Iwisa Maize Meal 5kg", was: 69.99, now: 54.99 },
    { item: "Rooibos Tea 80s", was: 44.99, now: 35.99 },
    { item: "Toilet Paper 2ply x9", was: 54.99, now: 44.99 },
  ],
  "Woolworths": [
    { item: "Avocado each", was: 24.99, now: 14.99 },
    { item: "Plain Yoghurt 1kg", was: 44.99, now: 34.99 },
    { item: "Cheddar Cheese 400g", was: 119.99, now: 89.99 },
  ],
}
