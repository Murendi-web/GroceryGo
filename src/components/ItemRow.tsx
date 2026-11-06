import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { RowItem } from '../types'
import { useShop } from '../context/ShopContext'
import { STORES, STORE_COLORS } from '../data/stores'
import { alpha, colors } from '../theme'
import { cheapestStore, lowestPrice, priceAt } from '../utils/pricing'
import { rand } from '../utils/format'
import { Icon } from './Icon'

export function ItemRow({ item }: { item: RowItem }) {
  const { store, favs, inList, toggleItem, toggleFav } = useShop()
  const [open, setOpen] = useState(false)

  const custom = Boolean(item.isCustom)
  const price = custom ? item.price ?? 0 : priceAt(item.prices, store)
  const listed = inList(item.name)
  const isFav = favs.includes(item.name)
  const best = !custom && cheapestStore(item.prices) === store
  const low = lowestPrice(item.prices)

  return (
    <View>
      <Pressable
        onPress={() => toggleItem(item)}
        style={[
          styles.row,
          listed && { backgroundColor: alpha(item.col, 0.06), borderColor: alpha(item.col, 0.4) },
          open && styles.rowOpen,
        ]}
      >
        <View style={[styles.stripe, { backgroundColor: item.col }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {custom ? <Text style={styles.custom}>Custom item</Text> : null}
          {best ? <Text style={styles.best}>Best price in SA</Text> : null}
        </View>
        <Pressable onPress={() => toggleFav(item.name)} hitSlop={8} style={styles.heart}>
          <Icon name="heart" size={14} color={isFav ? colors.red : colors.muted} fill={isFav ? colors.red : 'none'} />
        </Pressable>
        {!custom ? (
          <Pressable onPress={() => setOpen((o) => !o)} style={[styles.cmp, open && { borderColor: colors.accent, backgroundColor: alpha(colors.accent, 0.07) }]}>
            <Text style={[styles.cmpText, open && { color: colors.accent }]}>Compare</Text>
          </Pressable>
        ) : null}
        <Text style={styles.price}>{rand(price)}</Text>
        <Pressable onPress={() => toggleItem(item)} style={[styles.add, listed && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
          <Icon name={listed ? 'check' : 'plus'} size={12} color={listed ? '#fff' : colors.muted} strokeWidth={2.5} />
        </Pressable>
      </Pressable>

      {open && !custom ? (
        <View style={styles.compare}>
          {STORES.map((s, i) => {
            const p = item.prices[i] ?? null
            const isBest = p != null && p === low
            const current = s === store
            return (
              <View key={s} style={[styles.cmpRow, i < STORES.length - 1 && styles.cmpDivider, current && { backgroundColor: '#FFF9F5' }]}>
                <View style={styles.cmpStore}>
                  <View style={[styles.dot, { backgroundColor: STORE_COLORS[s] }]} />
                  <Text style={[styles.cmpName, current && { fontWeight: '700', color: colors.text }]}>{s}</Text>
                </View>
                <View style={styles.cmpRight}>
                  {isBest ? <Text style={styles.bestTag}>BEST</Text> : null}
                  {p != null && !isBest ? <Text style={styles.diff}>+{rand(p - low)}</Text> : null}
                  <Text style={[styles.cmpPrice, p == null && { color: colors.muted }, isBest && { color: colors.green }]}>{rand(p)}</Text>
                </View>
              </View>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 11, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  rowOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  stripe: { width: 3, height: 34, borderRadius: 2 },
  name: { fontSize: 13, fontWeight: '600', color: colors.text },
  custom: { fontSize: 9, fontWeight: '700', color: colors.gold, marginTop: 1 },
  best: { fontSize: 9, fontWeight: '700', color: colors.green, marginTop: 1 },
  heart: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  cmp: { paddingHorizontal: 7, paddingVertical: 4, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border2, borderRadius: 6 },
  cmpText: { fontSize: 9, fontWeight: '700', color: colors.muted },
  price: { fontSize: 13, fontWeight: '700', color: colors.accent, minWidth: 56, textAlign: 'right' },
  add: { width: 27, height: 27, borderRadius: 7, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  compare: { backgroundColor: colors.surface, borderWidth: 1, borderTopWidth: 0, borderColor: colors.border, borderBottomLeftRadius: 11, borderBottomRightRadius: 11, overflow: 'hidden', marginBottom: 2 },
  cmpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 13 },
  cmpDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  cmpStore: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  cmpName: { fontSize: 12, color: colors.sub },
  cmpRight: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  bestTag: { fontSize: 9, fontWeight: '700', color: colors.green, backgroundColor: alpha(colors.green, 0.08), paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  diff: { fontSize: 11, color: colors.muted },
  cmpPrice: { fontSize: 13, fontWeight: '700', color: colors.text },
})
