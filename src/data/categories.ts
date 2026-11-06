import type { CategoryName } from '../types'

export interface CategoryDef {
  col: string
  keys: string[]
}

export const CATEGORIES: Record<CategoryName, CategoryDef> = {
  "Grains & Staples": {
    col: "#8B6914",
    keys: [
      "Ace Maize Meal 5kg",
      "Iwisa Maize Meal 5kg",
      "Tastic Rice 2kg",
      "Excella Rice 2kg",
      "Albany White Bread 700g",
      "Sasko Brown Bread 700g",
      "Golden Cloud Cake Flour 1kg",
      "Spaghetti 500g",
    ],
  },
  "Meat & Poultry": {
    col: "#B83232",
    keys: [
      "Chicken Portions 1kg",
      "Whole Chicken each",
      "Boerewors per kg",
      "Beef Mince per kg",
      "Lamb Braai Chops per kg",
      "Pork Rashers per kg",
      "Chicken Livers per kg",
    ],
  },
  "Fresh Produce": {
    col: "#2A7A50",
    keys: [
      "Tomatoes per kg",
      "Onions per kg",
      "Potatoes per kg",
      "Cabbage each",
      "Spinach bunch",
      "Carrots per kg",
      "Butternut per kg",
      "Avocado each",
      "Garlic per head",
    ],
  },
  "Dairy & Eggs": {
    col: "#C17A20",
    keys: [
      "Full Cream Milk 2L",
      "Nulaid Eggs x18",
      "Cheddar Cheese 400g",
      "Butter 500g",
      "Plain Yoghurt 1kg",
      "Maas 2L",
    ],
  },
  "Pantry": {
    col: "#6B4C9A",
    keys: [
      "Sunflower Oil 2L",
      "White Sugar 1kg",
      "Aromat 200g",
      "Mrs Balls Chutney 470g",
      "Tomato Paste 115g",
      "Braai Spice 200g",
      "Curry Powder 100g",
      "Tomato Sauce 500ml",
    ],
  },
  "Beverages": {
    col: "#1A7A9A",
    keys: [
      "Rooibos Tea 80s",
      "Milo 500g",
      "Cremora 750g",
      "Coke 2L",
      "Oros Squash 2L",
      "Still Water 5L",
    ],
  },
  "Snacks": {
    col: "#7A3A6A",
    keys: [
      "Simba Chips 120g",
      "Biltong 100g",
      "Droewors 100g",
      "Peanut Butter 400g",
    ],
  },
  "Household": {
    col: "#3A6A7A",
    keys: [
      "Sunlight Dish Soap 750ml",
      "OMO Washing Powder 2kg",
      "Toilet Paper 2ply x9",
      "Garbage Bags 20s",
      "Handy Andy 750ml",
      "Bleach 750ml",
    ],
  },
}
