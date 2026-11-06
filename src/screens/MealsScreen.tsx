import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useShop } from '../context/ShopContext'
import { MEALS } from '../data/meals'
import { suggestItems } from '../services/aiTasks'
import { colors, serif } from '../theme'
import { priceAt } from '../utils/pricing'
import { rand } from '../utils/format'
import { ItemRow } from '../components/ItemRow'
import { Label, PrimaryButton, card } from '../components/ui'

export function MealsScreen({ onGoToList }: { onGoToList: () => void }) {
  const { catalog, store, list, budgetNum, total, addMeal, showToast } = useShop()
  const [suggested, setSuggested] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const runSuggest = async () => {
    setLoading(true)
    try {
      setSuggested(await suggestItems({ store, list, budget: budgetNum, total }, catalog))
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not get suggestions', 'remove')
    }
    setLoading(false)
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 9 }}>
        <Text style={styles.title}>Meal planner</Text>
        <Text style={styles.sub}>One tap adds all ingredients</Text>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 9 }}>
        {MEALS.map((meal) => {
          const cost = meal.keys.reduce((sum, key) => {
            const entry = catalog.find((c) => c.name === key)
            return sum + (entry ? priceAt(entry.prices, store) : 0)
          }, 0)
          return (
            <View key={meal.name} style={[card, { overflow: 'hidden' }]}>
              <View style={{ height: 3, backgroundColor: meal.col }} />
              <View style={{ padding: 13 }}>
                <View style={styles.mealHead}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealMeta}>Serves {meal.serves}, {meal.time}</Text>
                </View>
                <Text style={styles.ingredients}>{meal.keys.join(', ')}</Text>
                <View style={styles.mealFoot}>
                  <View>
                    <Text style={styles.est}>Estimate at {store}</Text>
                    <Text style={styles.cost}>{rand(cost)}</Text>
                  </View>
                  <PrimaryButton
                    title="Add to list"
                    onPress={() => {
                      addMeal(meal)
                      onGoToList()
                    }}
                    style={{ width: 130 }}
                  />
                </View>
              </View>
            </View>
          )
        })}
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Label text="AI suggestions" />
        <PrimaryButton title="Suggest items for me" onPress={runSuggest} loading={loading} style={{ marginBottom: 11 }} />
        <View style={{ gap: 6 }}>
          {suggested.map((name) => {
            const entry = catalog.find((c) => c.name === name)
            return entry ? <ItemRow key={name} item={entry} /> : null
          })}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 25, fontWeight: '900', color: colors.text, fontFamily: serif, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  mealHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  mealName: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  mealMeta: { fontSize: 10, color: colors.sub, backgroundColor: colors.pill, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  ingredients: { fontSize: 11, color: colors.muted, lineHeight: 19, marginBottom: 11 },
  mealFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  est: { fontSize: 9, fontWeight: '700', color: colors.muted, letterSpacing: 1 },
  cost: { fontSize: 17, fontWeight: '800', color: colors.accent, marginTop: 1 },
})
