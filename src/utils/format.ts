export const rand = (n: number | null | undefined): string =>
  n == null ? 'N/A' : `R ${Number(n).toFixed(2)}`

export const formatDate = (ms: number): string =>
  new Date(ms).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

export const initial = (name: string): string => (name.trim().charAt(0) || 'G').toUpperCase()

export const titleCase = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
