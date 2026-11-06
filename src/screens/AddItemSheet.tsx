import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import type { CategoryOrOther } from '../types'
import { useShop } from '../context/ShopContext'
import { CATEGORY_NAMES } from '../data/catalog'
import { CATEGORIES } from '../data/categories'
import { estimatePrice } from '../services/aiTasks'
import { alpha, colors } from '../theme'
import { priceAt } from '../utils/pricing'
import { rand } from '../utils/format'
import { Icon } from '../components/Icon'
import { Label, PrimaryButton, Sheet, card } from '../components/ui'

const CATEGORY_OPTIONS: CategoryOrOther[] = [...CATEGORY_NAMES, 'Other']

export function AddItemSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { catalog, store, inList, toggleItem, addCustomItem, showToast } = useShop()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState<CategoryOrOther>('Other')
  const [loading, setLoading] = useState(false)
  const [aiFilled, setAiFilled] = useState(false)

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase()
    return q.length < 2 ? [] : catalog.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5)
  }, [name, catalog])

  const reset = () => {
    setName('')
    setPrice('')
    setCategory('Other')
    setAiFilled(false)
  }
  const close = () => {
    reset()
    onClose()
  }

  const exact = catalog.find((c) => c.name.toLowerCase() === name.trim().toLowerCase())

  const runEstimate = async () => {
    if (!name.trim()) return
    if (exact) {
      setPrice(priceAt(exact.prices, store).toFixed(2))
      setCategory(exact.cat)
      return
    }
    setLoading(true)
    try {
      const result = await estimatePrice(name.trim(), store)
      setPrice(result.price.toFixed(2))
      setCategory(result.category)
      setAiFilled(true)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not estimate the price', 'remove')
    }
    setLoading(false)
  }

  const submit = () => {
    const typed = parseFloat(price)
    if (exact) {
      if (inList(exact.name)) showToast('Already in your list', 'remove')
      else toggleItem(exact, Number.isFinite(typed) && typed > 0 ? typed : undefined)
      close()
      return
    }
    if (addCustomItem({ name, cat: category, price: Number.isFinite(typed) ? typed : 0 })) close()
  }

  return (
    <Sheet visible={visible} onClose={close} title="Add item">
      <Label text="Item name" />
      <View style={styles.nameRow}>
        <View style={styles.nameBox}>
          <Icon name="search" size={13} color={colors.muted} strokeWidth={2} />
          <TextInput
            autoFocus
            style={styles.nameInput}
            placeholder='e.g. "Jungle Oats 1kg"'
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={(v) => {
              setName(v)
              setPrice('')
              setAiFilled(false)
            }}
            onSubmitEditing={runEstimate}
          />
        </View>
        <PrimaryButton title="AI price" onPress={runEstimate} disabled={!name.trim()} loading={loading} style={{ width: 96 }} />
      </View>

      {suggestions.length > 0 ? (
        <View style={[card, { overflow: 'hidden', marginBottom: 10 }]}>
          <Text style={styles.sugHead}>FROM CATALOGUE</Text>
          {suggestions.map((s, i) => (
            <Pressable
              key={s.name}
              onPress={() => {
                setName(s.name)
                setPrice(priceAt(s.prices, store).toFixed(2))
                setCategory(s.cat)
                setAiFilled(false)
              }}
              style={[styles.sug, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
            >
              <View style={{ width: 3, height: 28, borderRadius: 2, backgroundColor: s.col }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sugName}>{s.name}</Text>
                <Text style={styles.sugCat}>{s.cat}</Text>
              </View>
              <Text style={styles.sugPrice}>{rand(priceAt(s.prices, store))}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Label text="Price (ZAR)" />
      <View style={[styles.priceBox, price ? { borderColor: colors.green } : null]}>
        <Text style={[styles.currency, price ? { color: colors.green } : null]}>R</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="0.00"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={price}
          onChangeText={(v) => {
            setPrice(v.replace(/[^\d.]/g, ''))
            setAiFilled(false)
          }}
        />
      </View>
      {aiFilled ? <Text style={styles.aiNote}>AI estimated price. Edit it if you know better.</Text> : null}

      <Label text="Category" style={{ marginTop: 12 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {CATEGORY_OPTIONS.map((c) => {
          const on = c === category
          const col = c === 'Other' ? colors.sub : CATEGORIES[c].col
          return (
            <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, on && { backgroundColor: alpha(col, 0.1), borderColor: alpha(col, 0.4) }]}>
              <Text style={[styles.chipText, on && { color: col, fontWeight: '700' }]}>{c}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <PrimaryButton title="Add to list" onPress={submit} disabled={!name.trim()} />
    </Sheet>
  )
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  nameBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12 },
  nameInput: { flex: 1, fontSize: 13, color: colors.text, paddingVertical: 12 },
  sugHead: { fontSize: 9, fontWeight: '700', color: colors.muted, letterSpacing: 1.5, paddingHorizontal: 11, paddingTop: 7, paddingBottom: 3 },
  sug: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8, paddingHorizontal: 11 },
  sugName: { fontSize: 13, fontWeight: '500', color: colors.text },
  sugCat: { fontSize: 10, color: colors.muted },
  sugPrice: { fontSize: 13, fontWeight: '700', color: colors.accent },
  priceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12 },
  currency: { fontWeight: '700', fontSize: 14, color: colors.muted, marginRight: 4 },
  priceInput: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text, paddingVertical: 12 },
  aiNote: { fontSize: 10, color: colors.green, fontWeight: '600', marginTop: 4 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: 6 },
  chipText: { fontSize: 11, color: colors.sub },
})
