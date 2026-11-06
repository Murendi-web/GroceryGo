/**
 * Splits a list into what stays after "Clear done".
 * `finished` is true only when the list had items and every one was collected.
 * That is the moment the budget resets.
 */
export function clearCollected<T extends { checked: boolean }>(list: T[]): { remaining: T[]; finished: boolean } {
  return {
    remaining: list.filter((i) => !i.checked),
    finished: list.length > 0 && list.every((i) => i.checked),
  }
}