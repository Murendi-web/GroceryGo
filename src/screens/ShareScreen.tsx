import React from 'react'
import { Share, StyleSheet, Text, View } from 'react-native'
import { useShop } from '../context/ShopContext'
import { colors } from '../theme'
import { rand } from '../utils/format'
import { EmptyState, PrimaryButton, SubScreen, card } from '../components/ui'

export function ShareScreen({ onBack }: { onBack: () => void }) {
  const { list, store, total } = useShop()

  const message =
    `GroceryGo list (${store})\n` +
    list.map((i) => `- ${i.name} x${i.qty} (${rand(i.price * i.qty)})`).join('\n') +
    `\n\nTotal: ${rand(total)}`

  return (
    <SubScreen title="Share list" subtitle="Send it to family or friends" onBack={onBack}>
      {list.length === 0 ? (
        <EmptyState icon="share" title="Your list is empty" body="Add some items before you share." />
      ) : (
        <View>
          <View style={[card, { padding: 13, marginBottom: 12 }]}>
            {list.map((i) => (
              <View key={i.name} style={styles.row}>
                <Text style={styles.name}>{i.name} x{i.qty}</Text>
                <Text style={styles.price}>{rand(i.price * i.qty)}</Text>
              </View>
            ))}
            <View style={[styles.row, { borderBottomWidth: 0, paddingTop: 9 }]}>
              <Text style={styles.sum}>{list.length} items, {store}</Text>
              <Text style={styles.sumPrice}>{rand(total)}</Text>
            </View>
          </View>
          <PrimaryButton title="Share list" icon="share" onPress={() => Share.share({ message })} />
          <Text style={styles.hint}>Opens your phone's share sheet. Pick WhatsApp, Messages or any app.</Text>
        </View>
      )}
    </SubScreen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { flex: 1, fontSize: 13, color: colors.text },
  price: { fontSize: 13, fontWeight: '700', color: colors.accent },
  sum: { fontSize: 12, color: colors.sub },
  sumPrice: { fontSize: 15, fontWeight: '800', color: colors.accent },
  hint: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 12, lineHeight: 18 },
})
