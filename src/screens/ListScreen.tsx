import React, { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { ListItem } from '../types'
import { useShop } from '../context/ShopContext'
import { categoryColor } from '../data/catalog'
import { colors, gradient, serif } from '../theme'
import { rand } from '../utils/format'
import { Icon } from '../components/Icon'
import { EmptyState, OutlineButton, PrimaryButton, card } from '../components/ui'

interface Props {
  onAddItem: () => void
  onShare: () => void
}

export function ListScreen({ onAddItem, onShare }: Props) {
  const { list, store, total, budgetNum, overBudget, doneCount, progress, clearDone, saveTrip } = useShop()

  const groups = useMemo(() => {
    const map = new Map<string, ListItem[]>()
    for (const item of list) map.set(item.cat, [...(map.get(item.cat) ?? []), item])
    return [...map.entries()]
  }, [list])

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.head}>
        <View>
          <Text style={styles.title}>My list</Text>
          <Text style={styles.sub}>{list.length} items, {store}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 3 }}>
          {list.length > 0 ? (
            <Pressable onPress={onShare} style={styles.shareBtn} hitSlop={6}>
              <Icon name="share" size={13} color={colors.accent} strokeWidth={2} />
            </Pressable>
          ) : null}
          {doneCount > 0 ? (
            <Pressable onPress={clearDone} style={styles.clear}>
              <Text style={styles.clearText}>Clear done</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 11 }}>
        <PrimaryButton title="Add item to list" icon="plus" onPress={onAddItem} />
      </View>

      {list.length > 0 ? (
        <>
          <View style={{ paddingHorizontal: 16, paddingBottom: 9 }}>
            <View style={styles.progressHead}>
              <Text style={styles.muted11}>{doneCount} of {list.length} collected</Text>
              <Text style={styles.pct}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.track}>
              <LinearGradient colors={gradient.progress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${progress}%`, height: '100%' }} />
            </View>
          </View>
          <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.totalCard}>
            <View>
              <Text style={styles.totalLabel}>ESTIMATED TOTAL</Text>
              <Text style={styles.totalValue}>{rand(total)}</Text>
            </View>
            {budgetNum > 0 ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.totalLabel}>BUDGET</Text>
                <Text style={[styles.totalValue, overBudget && { color: '#FFD0D0' }]}>{rand(budgetNum)}</Text>
              </View>
            ) : null}
          </LinearGradient>
          <View style={{ paddingHorizontal: 16, paddingBottom: 11 }}>
            <OutlineButton title="Save trip to history" onPress={saveTrip} />
          </View>
        </>
      ) : null}

      {list.length === 0 ? (
        <EmptyState icon="bag" title="Your list is empty" body="Tap Add item to start, or browse items on the Home tab." />
      ) : (
        groups.map(([cat, items]) => (
          <View key={cat} style={{ marginBottom: 7 }}>
            <Text style={[styles.groupHead, { color: categoryColor(cat), borderLeftColor: categoryColor(cat) }]}>{cat.toUpperCase()}</Text>
            <View style={{ paddingHorizontal: 16, gap: 5 }}>
              {items.map((item) => (
                <ListRow key={item.name} item={item} />
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  )
}

function ListRow({ item }: { item: ListItem }) {
  const { toggleChecked, setQty, removeItem } = useShop()
  const [draft, setDraft] = React.useState<string | null>(null)

  return (
    <View style={[card, styles.row, item.checked && { opacity: 0.42 }]}>
      <Pressable onPress={() => toggleChecked(item.name)} style={[styles.check, item.checked && { backgroundColor: colors.green, borderColor: colors.green }]} hitSlop={6}>
        {item.checked ? <Icon name="check" size={10} color="#fff" strokeWidth={3} /> : null}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, item.checked && { textDecorationLine: 'line-through' }]} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.each}>{rand(item.price)} each{item.isCustom ? ', custom' : ''}</Text>
      </View>
      <View style={styles.qty}>
        <Pressable onPress={() => setQty(item.name, item.qty - 1)} style={styles.qtyBtn} hitSlop={4}>
          <Text style={styles.qtyBtnText}>-</Text>
        </Pressable>
        <TextInput
          style={styles.qtyInput}
          keyboardType="number-pad"
          value={draft ?? String(item.qty)}
          onChangeText={(v) => setDraft(v.replace(/[^\d]/g, ''))}
          onBlur={() => {
            if (draft !== null) setQty(item.name, parseInt(draft, 10) || 1)
            setDraft(null)
          }}
          selectTextOnFocus
        />
        <Pressable onPress={() => setQty(item.name, item.qty + 1)} style={styles.qtyBtn} hitSlop={4}>
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.lineTotal}>{rand(item.price * item.qty)}</Text>
      <Pressable onPress={() => removeItem(item.name)} hitSlop={8}>
        <Icon name="trash" size={13} color={colors.muted} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 9 },
  title: { fontSize: 25, fontWeight: '900', color: colors.text, fontFamily: serif, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  shareBtn: { width: 31, height: 31, borderRadius: 8, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  clear: { backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border, borderRadius: 7, paddingHorizontal: 9, justifyContent: 'center' },
  clearText: { fontSize: 11, fontWeight: '600', color: colors.sub },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  muted11: { fontSize: 11, color: colors.muted },
  pct: { fontSize: 11, color: colors.accent, fontWeight: '700' },
  track: { height: 4, backgroundColor: colors.border, borderRadius: 7, overflow: 'hidden' },
  totalCard: { marginHorizontal: 16, marginBottom: 11, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 2 },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#fff', fontFamily: serif },
  groupHead: { fontSize: 9, fontWeight: '700', letterSpacing: 2.2, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 16, marginBottom: 5, borderLeftWidth: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 11, borderRadius: 10 },
  check: { width: 21, height: 21, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 12, fontWeight: '500', color: colors.text },
  each: { fontSize: 10, color: colors.muted, marginTop: 1 },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 23, height: 23, borderRadius: 6, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 15, fontWeight: '700', color: colors.sub, lineHeight: 18 },
  qtyInput: { width: 30, textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.text, paddingVertical: 0 },
  lineTotal: { fontSize: 11, fontWeight: '700', color: colors.accent, minWidth: 52, textAlign: 'right' },
})
