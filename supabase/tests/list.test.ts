import { clearCollected } from '../src/utils/list'

let fails = 0
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fails++
  console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`)
}
const item = (name: string, checked: boolean) => ({ name, checked })

let r = clearCollected([item('Milk', true), item('Eggs', true)])
eq('all collected: list empties and budget resets', [r.remaining.length, r.finished], [0, true])

r = clearCollected([item('Milk', true), item('Eggs', false)])
eq('partly collected: keeps the rest, no reset', [r.remaining.map((i) => i.name), r.finished], [['Eggs'], false])

r = clearCollected([item('Milk', false), item('Eggs', false)])
eq('nothing collected: nothing removed, no reset', [r.remaining.length, r.finished], [2, false])

r = clearCollected([])
eq('empty list: no reset (a budget set before shopping survives)', [r.remaining.length, r.finished], [0, false])

r = clearCollected([item('Milk', true)])
eq('single collected item finishes the list', r.finished, true)

const original = [item('Milk', true), item('Eggs', false)]
clearCollected(original)
eq('does not mutate the input list', original.length, 2)

console.log(fails === 0 ? '\nALL PASSED' : `\n${fails} FAILED`)
process.exit(fails === 0 ? 0 : 1)