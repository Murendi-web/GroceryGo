import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useShop } from '../context/ShopContext'
import { SPECIALS } from '../data/specials'
import { COMPARE_ITEMS, STORES, STORE_COLORS } from '../data/stores'
import { alpha, colors, gradient, serif } from '../theme'
import { lowestPrice } from '../utils/pricing'
import { rand } from '../utils/format'
import { Icon } from '../components/Icon'
import { Label, card } from '../components/ui'

export function DealsScreen() {
  const { catalog, store, setStore, inList, toggleItem } = useShop()
  const specials = SPECIALS[store]

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      <LinearGradient colors={gradient.deals} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroLabel}>THIS WEEK</Text>
        <Text style={styles.heroTitle}>Specials and deals</Text>
        <Text style={styles.heroSub}>{store}</Text>
      </LinearGradient>

      <View style={{ paddingHorizontal: 16, paddingTop: 13 }}>
        <Label text="Select store" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 11 }}>
          {STORES.map((s) => {
            const on = s === store
            return (
              <Pressable key={s} onPress={() => setStore(s)} style={[styles.chip, on && { backgroundColor: STORE_COLORS[s], borderColor: STORE_COLORS[s] }]}>
                <Text style={[styles.chipText, on && { color: '#fff' }]}>{s}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <Label text={`${store} specials`} />
        <Text style={styles.disclaimer}>Specials are sample data until the live price feed is connected.</Text>
        <View style={{ gap: 8, marginBottom: 18 }}>
          {specials.map((sp) => {
            const entry = catalog.find((c) => c.name === sp.item)
            const listed = inList(sp.item)
            const saving = sp.was - sp.now
            const pct = Math.round((saving / sp.was) * 100)
            return (
              <View key={sp.item} style={[card, { overflow: 'hidden', borderRadius: 11 }]}>
                <LinearGradient colors={gradient.progress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />
                <View style={styles.special}>
                  <View style={styles.pctBox}>
                    <Text style={styles.pctLabel}>SAVE</Text>
                    <Text style={styles.pctValue}>{pct}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.spName}>{sp.item}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 4 }}>
                      <Text style={styles.was}>{rand(sp.was)}</Text>
                      <Text style={styles.now}>{rand(sp.now)}</Text>
                    </View>
                    <Text style={styles.save}>Save {rand(saving)}</Text>
                  </View>
                  <Pressable
                    onPress={() => entry && toggleItem(entry, sp.now)}
                    style={[styles.addBtn, listed && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                  >
                    <Icon name={listed ? 'check' : 'plus'} size={13} color={listed ? '#fff' : colors.accent} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>
            )
          })}
        </View>

        <Label text="Cross-store comparison" />
        {COMPARE_ITEMS.map((name) => {
          const entry = catalog.find((c) => c.name === name)
          if (!entry) return null
          const low = lowestPrice(entry.prices)
          return (
            <View key={name} style={[card, { marginBottom: 8, overflow: 'hidden', borderRadius: 10 }]}>
              <View style={styles.cmpHead}>
                <Text style={styles.cmpName}>{name}</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {STORES.map((s, i) => {
                  const p = entry.prices[i] ?? null
                  const best = p != null && p === low
                  return (
                    <View key={s} style={[styles.cell, s === store && { backgroundColor: '#FFF9F5' }, i < 3 && styles.cellBottom, i % 3 !== 2 && styles.cellRight]}>
                      <Text style={styles.cellStore}>{s.toUpperCase()}</Text>
                      <Text style={[styles.cellPrice, p == null && { color: colors.muted }, best && { color: colors.green }]}>{rand(p)}</Text>
                      {best ? <Text style={styles.cellBest}>BEST</Text> : null}
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  heroLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 2.5, marginBottom: 5 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', fontFamily: serif, letterSpacing: -0.5 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: 5 },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.sub },
  disclaimer: { fontSize: 11, color: colors.muted, marginBottom: 10, marginTop: -3 },
  special: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12 },
  pctBox: { backgroundColor: alpha(colors.accent, 0.06), borderRadius: 9, paddingVertical: 9, paddingHorizontal: 10, alignItems: 'center', minWidth: 52 },
  pctLabel: { fontSize: 9, fontWeight: '700', color: colors.accent },
  pctValue: { fontSize: 18, fontWeight: '900', color: colors.accent },
  spName: { fontSize: 13, fontWeight: '600', color: colors.text },
  was: { fontSize: 11, color: colors.muted, textDecorationLine: 'line-through' },
  now: { fontSize: 17, fontWeight: '800', color: colors.accent },
  save: { fontSize: 11, color: colors.green, fontWeight: '600', marginTop: 1 },
  addBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  cmpHead: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.pill, borderBottomWidth: 1, borderBottomColor: colors.border },
  cmpName: { fontSize: 12, fontWeight: '600', color: colors.text },
  cell: { width: '33.333%', paddingVertical: 7, paddingHorizontal: 9 },
  cellBottom: { borderBottomWidth: 1, borderBottomColor: colors.border },
  cellRight: { borderRightWidth: 1, borderRightColor: colors.border },
  cellStore: { fontSize: 8, fontWeight: '600', color: colors.muted, letterSpacing: 0.6, marginBottom: 1 },
  cellPrice: { fontSize: 12, fontWeight: '700', color: colors.text },
  cellBest: { fontSize: 8, fontWeight: '700', color: colors.green },
})
