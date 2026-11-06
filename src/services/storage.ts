import AsyncStorage from '@react-native-async-storage/async-storage'

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage is a cache. A failed write must not break the app.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const KEYS = {
  onboarded: 'gg:onboarded',
  demoUser: 'gg:demo-user',
  shop: (userId: string) => `gg:shop:${userId}`,
} as const
