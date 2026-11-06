import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, serif } from '../theme'
import { Icon, type IconName } from '../components/Icon'

interface Slide {
  title: string
  body: string
  color: string
  icon: IconName
}

const SLIDES: Slide[] = [
  { title: 'Smart shopping', body: 'Compare prices across all 5 major SA grocery stores. Know where to save before you go.', color: '#D4500A', icon: 'cart' },
  { title: 'AI budget advisor', body: 'Enter your budget and the AI builds a full shopping list that fits your spend.', color: '#2A7A50', icon: 'chat' },
  { title: 'Meal planner', body: 'Plan your week and add every ingredient to your list in one tap.', color: '#6B4C9A', icon: 'meals' },
  { title: 'Your list, your way', body: 'Add any item, track specials, watch your spend and share the list with family.', color: '#D4900A', icon: 'list' },
]

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index] as Slide
  const last = index === SLIDES.length - 1

  return (
    <LinearGradient colors={[slide.color, `${slide.color}C0`, colors.bg]} locations={[0, 0.55, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.skipRow}>
          <Pressable onPress={onDone} style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <View style={styles.iconBox}>
            <Icon name={slide.icon} size={40} color="rgba(255,255,255,0.92)" strokeWidth={1.4} />
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </View>
        <View style={styles.bottom}>
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <Pressable key={s.title} onPress={() => setIndex(i)} hitSlop={8}>
                <View style={[styles.dot, i === index && styles.dotOn]} />
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => (last ? onDone() : setIndex(index + 1))} style={[styles.cta, last && { backgroundColor: '#fff' }]}>
            <Text style={[styles.ctaText, last && { color: slide.color }]}>{last ? 'Get started' : 'Next'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 22, paddingTop: 8 },
  skip: { paddingHorizontal: 13, paddingVertical: 5, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  skipText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  iconBox: { width: 90, height: 90, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 27, fontWeight: '900', color: '#fff', fontFamily: serif, letterSpacing: -0.5, marginBottom: 11, textAlign: 'center' },
  body: { fontSize: 14, color: 'rgba(255,255,255,0.86)', lineHeight: 23, textAlign: 'center' },
  bottom: { paddingHorizontal: 26, paddingBottom: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 22 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { width: 20, backgroundColor: '#fff' },
  cta: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
