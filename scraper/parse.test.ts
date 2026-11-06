import { parseRand, plausible } from './parse'

let fails = 0
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = got === want
  if (!ok) fails++
  console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : `got ${String(got)} want ${String(want)}`)
}
eq('R54.99', parseRand('R54.99'), 54.99)
eq('R 54.99', parseRand('R 54.99'), 54.99)
eq('R54,99 (comma decimal)', parseRand('R54,99'), 54.99)
eq('R 1 249.99 (space thousands)', parseRand('R 1 249.99'), 1249.99)
eq('R1,249.99 (comma thousands)', parseRand('R1,249.99'), 1249.99)
eq('R100', parseRand('R100'), 100)
eq('inside text', parseRand('Ace Maize Meal 5kg\nR 57.99\nAdd to cart'), 57.99)
eq('no price', parseRand('Out of stock'), null)
eq('plausible normal', plausible(57.99, 57.99), true)
eq('plausible 20% off', plausible(46, 57.99), true)
eq('rejects 10x (wrong product)', plausible(579, 57.99), false)
eq('rejects tiny', plausible(5, 57.99), false)
eq('no baseline sane', plausible(30, null), true)
eq('no baseline absurd', plausible(9000, null), false)
console.log(fails === 0 ? '\nALL PASSED' : `\n${fails} FAILED`)
process.exit(fails === 0 ? 0 : 1)
