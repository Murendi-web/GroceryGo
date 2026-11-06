import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BRAND } from '../data/brand'
import { colors, gradient, serif } from '../theme'
import { Icon } from '../components/Icon'

export function SplashScreen() {
  const scale = useRef(new Animated.Value(0.78)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 800, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
    ]).start()
  }, [opacity, scale])

  return (
    <LinearGradient colors={gradient.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
      <View style={[styles.circle, { top: -80, right: -80, width: 260, height: 260 }]} />
      <View style={[styles.circle, { bottom: -90, left: -60, width: 230, height: 230, opacity: 0.6 }]} />
      <Animated.View style={{ alignItems: 'center', opacity, transform: [{ scale }] }}>
        <View style={styles.logo}>
          <Icon name="bag" size={40} color="#fff" strokeWidth={1.4} />
        </View>
        <Text style={styles.title}>{BRAND.name}</Text>
        <Text style={styles.tagline}>{BRAND.tagline}</Text>
      </Animated.View>
      <Text style={styles.footer}>MADE IN SOUTH AFRICA</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.09)' },
  logo: { width: 86, height: 86, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontSize: 42, fontWeight: '900', color: '#fff', fontFamily: serif, letterSpacing: -1.5 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 9 },
  footer: { position: 'absolute', bottom: 48, fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 2 },
})