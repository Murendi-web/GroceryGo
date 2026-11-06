import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useShop } from '../context/ShopContext'
import { colors } from '../theme'

export function Toast() {
  const { toast } = useShop()
  if (!toast) return null
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={[styles.pill, { backgroundColor: toast.kind === 'remove' ? '#2A2520' : colors.accent }]}>
        <Text style={styles.text}>{toast.msg}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', zIndex: 999 },
  pill: { borderRadius: 19, paddingHorizontal: 17, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' },
})
