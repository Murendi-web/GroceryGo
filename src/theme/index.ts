import { Platform, type TextStyle, type ViewStyle } from 'react-native'

export const colors = {
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#EAE3D8',
  border2: '#D9CFBF',
  text: '#1C1610',
  sub: '#7A6E5E',
  muted: '#B0A090',
  accent: '#D4500A',
  accentLight: '#F06520',
  gold: '#D4900A',
  green: '#2A7A50',
  red: '#C03030',
  pill: '#F2EDE4',
  tipBg: '#FFFCF0',
  tipText: '#7A6010',
  errorBg: '#FFF5F5',
} as const

export const gradient = {
  brand: [colors.accent, colors.accentLight] as [string, string],
  hero: [colors.accent, colors.accentLight, colors.gold] as [string, string, string],
  deals: [colors.accent, colors.gold] as [string, string],
  progress: [colors.accent, colors.gold] as [string, string],
}

export const serif: TextStyle['fontFamily'] = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
})

export const cardShadow: ViewStyle = {
  shadowColor: '#3C280A',
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
}

export const alpha = (hex: string, a: number): string => {
  const n = Math.round(Math.min(1, Math.max(0, a)) * 255)
  return hex + n.toString(16).padStart(2, '0')
}
