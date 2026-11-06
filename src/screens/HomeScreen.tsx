import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { CategoryName } from '../types'
import { useShop } from '../context/ShopContext'
import { CATEGORIES } from '../data/categories'
import { CATEGORY_NAMES } from '../data/catalog'
import { PRICE_RANKING, STORE_TIPS } from '../data/stores'
import { alpha, colors, gradient, serif } from '../theme'
import { rand } from '../utils/format'
import { Icon } from '../components/Icon'
import { ItemRow } from '../components/ItemRow'
import { StorePicker } from '../components/StorePicker'
import { Label } from '../components/ui'

export function HomeScreen({ onOpenAdvisor }: { onOpenAdvisor: () => void }) {
  const { catalog, store, setStore, budget, setBudget, total, budgetNum, overBudget, list } = useShop()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryName>('Grains & Staples')
  const [tipOpen, setTipOpen] = useState(true)
  const [picker, setPicker] = useState(false)

  useEffect(() => setTipOpen(true), [store])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q) return catalog.filter((c) => c.name.toLowerCase().includes(q))
    return catalog.filter((c) => c.cat === category)
  }, [catalog, search, category])

  const pct = budgetNum > 0 ? Math.min((total / budgetNum) * 100, 100) : 0

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
      <LinearGradient colors={gradient.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroCircle} />
        <Text style={styles.heroTitle}>GroceryGo</Text>
        <Text style={styles.heroSub}>{store}</Text>
        {list.length > 0 ? (
          <View style={styles.cartChip}>
            <Text style={styles.cartLabel}>CART TOTAL</Text>
            <Text style={styles.cartValue}>{rand(total)}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <Pressable onPress={onOpenAdvisor} style={styles.advisor}>
        <View style={styles.advisorIcon}>
          <Icon name="chat" size={17} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.advisorTitle}>AI budget advisor</Text>
          <Text style={styles.advisorSub}>Enter your budget and I will build your list</Text>
        </View>
        <Icon name="chevronRight" size={14} color="rgba(255,255,255,0.7)" strokeWidth={2} />
      </Pressable>

      <View style={styles.budgetCard}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Label text="Budget" />
            <View style={styles.box}>
              <Text style={styles.currency}>R</Text>
              <TextInput
                style={styles.boxInput}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                value={budget}
                onChangeText={(v) => setBudget(v.replace(/[^\d.]/g, ''))}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Label text="Store" />
            <Pressable style={styles.box} onPress={() => setPicker(true)}>
              <Text style={styles.storeName} numberOfLines={1}>{store}</Text>
              <Icon name="chevronDown" size={14} color={colors.muted} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
        {budgetNum > 0 ? (
          <View style={{ marginTop: 11 }}>
            <View style={styles.track}>
              <LinearGradient
                colors={overBudget ? [colors.red, colors.red] : gradient.progress}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: `${pct}%`, height: '100%', borderRadius: 7 }}
              />
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.muted11}>{rand(total)} spent</Text>
              <Text style={[styles.muted11, overBudget && { color: colors.red, fontWeight: '700' }]}>
                {overBudget ? 'Over budget' : `${rand(budgetNum - total)} remaining`}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {tipOpen ? (
        <View style={styles.tip}>
          <Icon name="info" size={13} color={colors.gold} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipStore}>{store}</Text>
            <Text style={styles.tipText}>{STORE_TIPS[store]}</Text>
          </View>
          <Pressable onPress={() => setTipOpen(false)} hitSlop={8}>
            <Icon name="close" size={11} color={colors.muted} strokeWidth={2.5} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.ranking}>
        <Label text="Price ranking, cheapest to priciest" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PRICE_RANKING.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => setStore(s)} style={[styles.rankChip, s === store && styles.rankChipOn]}>
                <Text style={[styles.rankText, s === store && { color: colors.accent }]}>{s}</Text>
              </Pressable>
              {i < PRICE_RANKING.length - 1 ? <Icon name="chevronRight" size={9} color={colors.muted} strokeWidth={2.5} /> : null}
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <Label text="Browse and add" />
        <View style={styles.search}>
          <Icon name="search" size={13} color={colors.muted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search items at ${store}`}
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Icon name="close" size={11} color={colors.muted} strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </View>
        {!search ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {CATEGORY_NAMES.map((c) => {
              const on = c === category
              const col = CATEGORIES[c].col
              return (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.catChip, on && { backgroundColor: alpha(col, 0.1), borderColor: alpha(col, 0.4) }]}>
                  <Text style={[styles.catText, on && { color: col, fontWeight: '700' }]}>{c}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
        ) : null}
        <View style={{ gap: 6 }}>
          {shown.map((item) => (
            <ItemRow key={item.name} item={item} />
          ))}
          {shown.length === 0 ? <Text style={[styles.muted11, { textAlign: 'center', paddingVertical: 20 }]}>No items match your search.</Text> : null}
        </View>
      </View>
      <StorePicker visible={picker} value={store} onSelect={setStore} onClose={() => setPicker(false)} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, overflow: 'hidden' },
  heroCircle: { position: 'absolute', top: -50, right: -50, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroTitle: { fontSize: 29, fontWeight: '900', color: '#fff', fontFamily: serif, letterSpacing: -1 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  cartChip: { position: 'absolute', right: 18, bottom: 14, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.33)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  cartLabel: { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5 },
  cartValue: { fontSize: 15, fontWeight: '800', color: '#fff' },
  advisor: { flexDirection: 'row', alignItems: 'center', gap: 11, marginHorizontal: 16, marginTop: 12, backgroundColor: colors.green, borderRadius: 11, paddingVertical: 12, paddingHorizontal: 14 },
  advisorIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  advisorTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  advisorSub: { fontSize: 11, color: 'rgba(255,255,255,0.78)', marginTop: 1 },
  budgetCard: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 12, marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  box: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 9, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, height: 42 },
  currency: { fontWeight: '700', fontSize: 13, color: colors.accent, marginRight: 4 },
  boxInput: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text, paddingVertical: 0 },
  storeName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  track: { height: 4, backgroundColor: colors.border, borderRadius: 7, overflow: 'hidden' },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  muted11: { fontSize: 11, color: colors.muted },
  tip: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginHorizontal: 16, marginTop: 11, backgroundColor: colors.tipBg, borderWidth: 1, borderColor: alpha(colors.gold, 0.27), borderRadius: 10, padding: 12 },
  tipStore: { fontSize: 9, fontWeight: '700', color: colors.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  tipText: { fontSize: 12, color: colors.tipText, lineHeight: 19 },
  ranking: { marginHorizontal: 16, marginTop: 11, padding: 13, backgroundColor: colors.surface, borderRadius: 11, borderWidth: 1, borderColor: colors.border },
  rankChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border, marginHorizontal: 3 },
  rankChipOn: { backgroundColor: alpha(colors.accent, 0.07), borderColor: colors.accent },
  rankText: { fontSize: 10, fontWeight: '600', color: colors.sub },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, height: 42, marginBottom: 9 },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, paddingVertical: 0 },
  catChip: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: 6 },
  catText: { fontSize: 11, fontWeight: '500', color: colors.sub },
})
