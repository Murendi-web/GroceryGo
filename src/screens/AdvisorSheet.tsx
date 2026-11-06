import React, { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { BudgetPlan } from '../types'
import { useShop } from '../context/ShopContext'
import { buildBudgetPlan } from '../services/aiTasks'
import { alpha, colors } from '../theme'
import { rand } from '../utils/format'
import { ErrorBox, Label, OutlineButton, PrimaryButton, Sheet, card } from '../components/ui'

const PEOPLE = ['1', '2', '4', '6', '8+']

interface Props {
  visible: boolean
  onClose: () => void
  onAdded: () => void
}

export function AdvisorSheet({ visible, onClose, onAdded }: Props) {
  const { catalog, store, budget: shopBudget, addPlanItems } = useShop()
  const [budget, setBudget] = useState(shopBudget)
  const [people, setPeople] = useState('4')
  const [prefs, setPrefs] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<BudgetPlan | null>(null)
  const [error, setError] = useState('')

  const close = () => {
    setPlan(null)
    setError('')
    onClose()
  }

  const run = async () => {
    const amount = parseFloat(budget)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid budget.')
      return
    }
    setError('')
    setLoading(true)
    try {
      setPlan(await buildBudgetPlan({ budget: amount, people, prefs, store, catalog }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the list. Try again.')
    }
    setLoading(false)
  }

  return (
    <Sheet visible={visible} onClose={close} title="AI budget advisor" subtitle="Enter your budget and I will build your list">
      {!plan && !loading ? (
        <View>
          <Label text="Budget (ZAR)" />
          <View style={styles.budgetBox}>
            <Text style={styles.currency}>R</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="e.g. 500"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={budget}
              onChangeText={(v) => setBudget(v.replace(/[^\d.]/g, ''))}
            />
          </View>
          <Label text="Shopping for (people)" style={{ marginTop: 14 }} />
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {PEOPLE.map((n) => (
              <Pressable key={n} onPress={() => setPeople(n)} style={[styles.person, people === n && styles.personOn]}>
                <Text style={[styles.personText, people === n && { color: '#fff' }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Label text="Preferences (optional)" style={{ marginTop: 14 }} />
          <TextInput
            style={styles.prefs}
            placeholder='e.g. "no beef", "halaal", "braai items"'
            placeholderTextColor={colors.muted}
            value={prefs}
            onChangeText={setPrefs}
          />
          {error ? <ErrorBox message={error} /> : null}
          <PrimaryButton title="Build my shopping list" onPress={run} />
        </View>
      ) : null}

      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Building your list at {store}</Text>
        </View>
      ) : null}

      {plan ? (
        <View>
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>AI RECOMMENDATION</Text>
            <Text style={styles.summaryText}>{plan.summary}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[
              { l: 'Total', v: rand(plan.total), c: colors.accent },
              { l: 'Change', v: rand(plan.leftover), c: colors.green },
              { l: 'Items', v: String(plan.items.length), c: colors.text },
            ].map((s) => (
              <View key={s.l} style={[card, styles.stat]}>
                <Text style={[styles.statValue, { color: s.c }]}>{s.v}</Text>
                <Text style={styles.statLabel}>{s.l.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          {plan.items.length === 0 ? <ErrorBox message="Nothing fit that budget. Try a higher amount." /> : null}
          <View style={{ gap: 6, marginBottom: 12 }}>
            {plan.items.map((it) => (
              <View key={it.name} style={[card, styles.item]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>x{it.qty} {it.name}</Text>
                  {it.reason ? <Text style={styles.itemReason}>{it.reason}</Text> : null}
                </View>
                <Text style={styles.itemPrice}>{rand(it.price * it.qty)}</Text>
              </View>
            ))}
          </View>
          {plan.tip ? (
            <View style={styles.tip}>
              <Text style={styles.tipLabel}>TIP</Text>
              <Text style={styles.tipText}>{plan.tip}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <OutlineButton title="Retry" color={colors.sub} onPress={() => setPlan(null)} style={{ flex: 1, paddingVertical: 14 }} />
            <PrimaryButton
              title="Add all to my list"
              disabled={plan.items.length === 0}
              onPress={() => {
                addPlanItems(plan.items)
                close()
                onAdded()
              }}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      ) : null}
    </Sheet>
  )
}

const styles = StyleSheet.create({
  budgetBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13 },
  currency: { fontWeight: '700', fontSize: 15, color: colors.accent, marginRight: 5 },
  budgetInput: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, paddingVertical: 12 },
  person: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border },
  personOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  personText: { fontSize: 13, fontWeight: '700', color: colors.sub },
  prefs: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: colors.text, marginBottom: 14 },
  loadingText: { fontSize: 14, color: colors.sub, marginTop: 14 },
  summary: { backgroundColor: alpha(colors.green, 0.06), borderWidth: 1, borderColor: alpha(colors.green, 0.2), borderRadius: 11, padding: 13, marginBottom: 12 },
  summaryLabel: { fontSize: 9, fontWeight: '700', color: colors.green, letterSpacing: 1.5, marginBottom: 3 },
  summaryText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  stat: { flex: 1, padding: 11, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', color: colors.muted, letterSpacing: 1, marginTop: 3 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 13 },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.text },
  itemReason: { fontSize: 10, color: colors.muted, marginTop: 1 },
  itemPrice: { fontSize: 12, fontWeight: '700', color: colors.accent },
  tip: { backgroundColor: colors.tipBg, borderWidth: 1, borderColor: alpha(colors.gold, 0.27), borderRadius: 10, padding: 12, marginBottom: 14 },
  tipLabel: { fontSize: 9, fontWeight: '700', color: colors.gold, letterSpacing: 1.5, marginBottom: 3 },
  tipText: { fontSize: 12, color: colors.tipText, lineHeight: 19 },
})
