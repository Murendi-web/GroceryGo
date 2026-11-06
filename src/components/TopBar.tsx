import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../context/AuthContext'
import { colors, gradient } from '../theme'
import { initial } from '../utils/format'

/** Greeting on the left, profile avatar on the right. Tapping the avatar opens Profile. */
export function TopBar({ onProfile }: { onProfile: () => void }) {
  const { user } = useAuth()
  const name = user?.name ?? 'Guest'
  const first = name.split(' ')[0] ?? name

  return (
    <View style={styles.bar}>
      <View>
        <Text style={styles.hello}>Hi, {first}</Text>
      </View>
      <Pressable onPress={onProfile} accessibilityRole="button" accessibilityLabel="Open profile" hitSlop={8}>
        <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
          <Text style={styles.letter}>{initial(name)}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8, backgroundColor: colors.bg },
  hello: { fontSize: 15, fontWeight: '700', color: colors.text },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface, shadowColor: '#3C280A', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  letter: { color: '#fff', fontSize: 14, fontWeight: '800' },
})