import { buildCatalog } from '../src/data/catalog'
import { priceAt, lowestPrice, cheapestStore, parseModelJson } from '../src/utils/pricing'
import { isValidSaPhone, isValidEmail } from '../src/utils/validation'
import { rand } from '../src/utils/format'
import { MEALS } from '../src/data/meals'
import { SPECIALS } from '../src/data/specials'

let fails = 0
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fails++
  console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`)
}

const cat = buildCatalog()
eq('catalog size', cat.length, 54)
const ace = cat.find((c) => c.name === 'Ace Maize Meal 5kg')!
eq('Ace at Checkers', priceAt(ace.prices, 'Checkers'), 57.99)
eq('Ace lowest', lowestPrice(ace.prices), 52.99)
eq('Ace cheapest store', cheapestStore(ace.prices), 'Shoprite')
const albany = cat.find((c) => c.name === 'Albany White Bread 700g')!
eq('Woolworths not stocked falls back to first price', priceAt(albany.prices, 'Woolworths'), 17.99)
const live = buildCatalog({ 'Ace Maize Meal 5kg': [null, 55.5, null, null, null] })
const ace2 = live.find((c) => c.name === 'Ace Maize Meal 5kg')!
eq('live override Checkers', priceAt(ace2.prices, 'Checkers'), 55.5)
eq('live override keeps baseline for other stores', priceAt(ace2.prices, 'SPAR'), 59.99)
eq('every meal ingredient exists in catalog', MEALS.flatMap((m) => m.keys).filter((k) => !cat.some((c) => c.name === k)), [])
eq('every special exists in catalog', Object.values(SPECIALS).flat().filter((s) => !cat.some((c) => c.name === s.item)), [])
eq('every special is a real discount', Object.values(SPECIALS).flat().filter((s) => s.now >= s.was), [])
eq('phone 0712345678', isValidSaPhone('0712345678'), true)
eq('phone 071 234 5678', isValidSaPhone('071 234 5678'), true)
eq('phone +27 71 234 5678', isValidSaPhone('+27 71 234 5678'), true)
eq('phone too short', isValidSaPhone('071234'), false)
eq('phone US style', isValidSaPhone('+1 415 555 2671'), false)
eq('email ok', isValidEmail('a@b.co'), true)
eq('email bad', isValidEmail('a@b'), false)
eq('rand', rand(1234.5), 'R 1234.50')
eq('rand null', rand(null), 'N/A')
eq('json fences', parseModelJson<{ a: number }>('```json\n{"a":1}\n```'), { a: 1 })
console.log(fails === 0 ? '\nALL PASSED' : `\n${fails} FAILED`)
process.exit(fails === 0 ? 0 : 1)
