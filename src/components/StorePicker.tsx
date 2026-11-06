import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { StoreName } from '../types'
import { STORES, STORE_COLORS } from '../data/stores'
import { alpha, colors } from '../theme'
import { Icon } from './Icon'
import { Sheet } from './ui'

interface Props {
  visible: boolean
  value: StoreName
  onSelect: (s: StoreName) => void
  onClose: () => void
}

export function StorePicker({ visible, value, onSelect, onClose }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Choose your store" subtitle="Prices and totals update to match">
      <View style={{ gap: 8, paddingBottom: 6 }}>
        {STORES.map((s) => {
          const on = s === value
          return (
            <Pressable
              key={s}
              onPress={() => {
                onSelect(s)
                onClose()
              }}
              style={[styles.row, on && { borderColor: colors.accent, backgroundColor: alpha(colors.accent, 0.06) }]}
            >
              <View style={[styles.dot, { backgroundColor: STORE_COLORS[s] }]} />
              <Text style={[styles.name, on && { color: colors.accent, fontWeight: '800' }]}>{s}</Text>
              {on ? <Icon name="check" size={16} color={colors.accent} strokeWidth={2.5} /> : null}
            </Pressable>
          )
        })}
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 11, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
})
