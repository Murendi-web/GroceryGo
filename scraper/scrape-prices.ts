/**
 * Weekly price scraper. Writes only prices it actually read from a store website.
 * Items it cannot read are left untouched, so the app keeps the last known price.
 *
 * Run:  cd scraper && npm install && npx playwright install chromium && npm run scrape
 * Env:  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * IMPORTANT: the CSS selectors below are starting points. Store sites change often and some
 * block automated traffic. Open each site in a browser, inspect a product card, and adjust
 * the selectors before trusting any output. Check each retailer's terms of use first.
 */
import { chromium, type Page } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { BASE_PRICES } from '../src/data/prices'
import { STORE_INDEX } from '../src/data/stores'
import type { StoreName } from '../src/types'
import { parseRand, plausible } from './parse'

interface StoreConfig {
  store: StoreName
  searchUrl: (query: string) => string
  /** Selector for one product card in the search results. */
  card: string
  /** Selector for the price inside a card. Falls back to the whole card text. */
  price: string
}

const CONFIGS: StoreConfig[] = [
  { store: 'Checkers', searchUrl: (q) => `https://www.checkers.co.za/search?q=${encodeURIComponent(q)}`, card: "[data-testid='product-card'], .product-card", price: "[class*='price']" },
  { store: 'Pick n Pay', searchUrl: (q) => `https://www.pnp.co.za/search/${encodeURIComponent(q)}`, card: '.product-grid-item, [data-cnstrc-item-id]', price: "[class*='price']" },
  { store: 'Shoprite', searchUrl: (q) => `https://www.shoprite.co.za/search/all?q=${encodeURIComponent(q)}`, card: '.product-frame, .product-card', price: "[class*='price']" },
]

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

async function scrapeOne(page: Page, cfg: StoreConfig, item: string, baseline: number | null | undefined): Promise<number | null> {
  const brand = item.split(' ')[0]?.toLowerCase() ?? ''
  try {
    await page.goto(cfg.searchUrl(item), { waitUntil: 'domcontentloaded', timeout: 20_000 })
    await page.waitForSelector(cfg.card, { timeout: 8_000 })
    const cards = await page.$$(cfg.card)
    for (const card of cards.slice(0, 5)) {
      const text = (await card.innerText()).toLowerCase()
      if (brand && !text.includes(brand)) continue
      const priceEl = await card.$(cfg.price)
      const price = parseRand((priceEl ? await priceEl.innerText() : text) ?? '')
      if (price != null && plausible(price, baseline)) return price
    }
  } catch {
    // Timeouts and selector misses are normal. Skip the item.
  }
  return null
}

async function main(): Promise<void> {
  const items = Object.keys(BASE_PRICES)
  const browser = await chromium.launch({ headless: true })
  const rows: { item_name: string; store: StoreName; price: number; scraped_at: string; is_valid: boolean }[] = []
  const summary: Record<string, { ok: number; miss: number }> = {}

  for (const cfg of CONFIGS) {
    const context = await browser.newContext({ locale: 'en-ZA' })
    const page = await context.newPage()
    summary[cfg.store] = { ok: 0, miss: 0 }
    for (const item of items) {
      const baseline = BASE_PRICES[item]?.[STORE_INDEX[cfg.store]]
      const price = await scrapeOne(page, cfg, item, baseline)
      if (price == null) {
        summary[cfg.store]!.miss++
      } else {
        summary[cfg.store]!.ok++
        rows.push({ item_name: item, store: cfg.store, price, scraped_at: new Date().toISOString(), is_valid: true })
      }
      await page.waitForTimeout(1000 + Math.random() * 800)
    }
    await context.close()
  }
  await browser.close()

  console.table(summary)
  if (rows.length === 0) {
    console.error('Nothing scraped. Selectors probably need updating. Database left unchanged.')
    process.exit(1)
  }
  const { error } = await supabase.from('prices').upsert(rows, { onConflict: 'item_name,store' })
  if (error) {
    console.error('Save failed:', error.message)
    process.exit(1)
  }
  console.log(`Saved ${rows.length} prices.`)
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
