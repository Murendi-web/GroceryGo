import { buildCatalog } from '../src/data/catalog'
import { normalizePlan } from '../src/utils/plan'

let fails = 0
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fails++
  console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`)
}
const cat = buildCatalog()

let p = normalizePlan({ summary: 's', items: [{ name: 'Ace Maize Meal 5kg', qty: 2, reason: 'staple' }, { name: 'Unicorn Steak', qty: 1 }] }, 500, 'Checkers', cat)
eq('hallucinated item dropped', p.items.map((i) => i.name), ['Ace Maize Meal 5kg'])
eq('price comes from catalog (Checkers 57.99)', p.items[0]?.price, 57.99)
eq('total = 2 x 57.99', p.total, 115.98)
eq('leftover = 500 - 115.98', p.leftover, 384.02)

p = normalizePlan({ items: [{ name: 'Ace Maize Meal 5kg', qty: 1 }, { name: 'Ace Maize Meal 5kg', qty: 5 }] }, 500, 'Checkers', cat)
eq('duplicates collapsed to first', p.items.map((i) => i.qty), [1])

p = normalizePlan({ items: [{ name: 'Ace Maize Meal 5kg', qty: 1000 }] }, 100000, 'Checkers', cat)
eq('qty clamped to 20', p.items[0]?.qty, 20)
p = normalizePlan({ items: [{ name: 'Ace Maize Meal 5kg', qty: -3 }] }, 500, 'Checkers', cat)
eq('negative qty becomes 1', p.items[0]?.qty, 1)
p = normalizePlan({ items: [{ name: 'Ace Maize Meal 5kg', qty: 'lots' }] }, 500, 'Checkers', cat)
eq('non-numeric qty becomes 1', p.items[0]?.qty, 1)
p = normalizePlan({ items: [{ name: 'Ace Maize Meal 5kg', qty: 2.6 }] }, 500, 'Checkers', cat)
eq('fractional qty rounds', p.items[0]?.qty, 3)

p = normalizePlan({ items: [{ name: 'Ace Maize Meal 5kg', qty: 1 }, { name: 'Boerewors per kg', qty: 1 }, { name: 'Beef Mince per kg', qty: 1 }] }, 180, 'Checkers', cat)
eq('over budget (R180): Mince pushes 167.98 to 282.97, so only Mince is trimmed', p.items.map((i) => i.name), ['Ace Maize Meal 5kg', 'Boerewors per kg'])
eq('trimmed total is 167.98 and within budget', [p.total, p.total <= 180], [167.98, true])
p = normalizePlan({ items: [{ name: 'Ace Maize Meal 5kg', qty: 1 }, { name: 'Boerewors per kg', qty: 1 }, { name: 'Beef Mince per kg', qty: 1 }] }, 100, 'Checkers', cat)
eq('tighter budget (R100): trims until only Ace fits', p.items.map((i) => i.name), ['Ace Maize Meal 5kg'])
p = normalizePlan({ items: [{ name: 'Lamb Braai Chops per kg', qty: 1 }] }, 50, 'Checkers', cat)
eq('nothing fits -> empty plan, total 0, leftover = budget', [p.items.length, p.total, p.leftover], [0, 0, 50])

p = normalizePlan({ items: [{ name: 'Ace Maize Meal 5kg', qty: 1 }] }, 500, 'Woolworths', cat)
eq('store changes price (Woolworths 62.99)', p.items[0]?.price, 62.99)

p = normalizePlan({}, 500, 'Checkers', cat)
eq('garbage reply: safe defaults', [p.items.length, p.summary.length > 0, p.tip], [0, true, ''])
p = normalizePlan({ items: 'nope' as unknown as [] }, 500, 'Checkers', cat)
eq('items not an array: no crash', p.items.length, 0)
p = normalizePlan({ items: [null as unknown as { name: string }] }, 500, 'Checkers', cat)
eq('null item: no crash', p.items.length, 0)
console.log(fails === 0 ? '\nALL PASSED' : `\n${fails} FAILED`)
process.exit(fails === 0 ? 0 : 1)
