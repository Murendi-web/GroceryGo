import React from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { useShop } from '../context/ShopContext'
import { NEARBY } from '../data/nearby'
import { STORES, STORE_COLORS } from '../data/stores'
import { alpha, colors } from '../theme'
import { OutlineButton, PrimaryButton, SubScreen, card } from '../components/ui'

export function LocatorScreen({ onBack }: { onBack: () => void }) {
  const { setStore, showToast } = useShop()

  return (
    <SubScreen title="Store locator" subtitle="Near Johannesburg" onBack={onBack}>
      <View style={styles.note}>
        <Text style={styles.noteText}>Distances are sample data. Live GPS lookup comes in V2. Directions open in Maps.</Text>
      </View>
      {NEARBY.map((s) => {
        const match = STORES.find((st) => s.name.includes(st))
        return (
          <View key={s.name} style={[card, { overflow: 'hidden', marginBottom: 9 }]}>
            <View style={{ height: 3, backgroundColor: match ? STORE_COLORS[match] : colors.accent }} />
            <View style={{ padding: 13 }}>
              <View style={styles.row}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.km}>{s.km} km</Text>
              </View>
              <Text style={styles.addr}>{s.addr}, {s.hours}</Text>
              <View style={{ flexDirection: 'row', gap: 7 }}>
                <PrimaryButton
                  title="Directions"
                  onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name} ${s.addr}`)}`)}
                  style={{ flex: 1 }}
                />
                <OutlineButton
                  title="Set as my store"
                  color={colors.sub}
                  onPress={() => {
                    if (match) {
                      setStore(match)
                      showToast(`Store set to ${match}`)
                      onBack()
                    }
                  }}
                  style={{ flex: 1, paddingVertical: 14 }}
                />
              </View>
            </View>
          </View>
        )
      })}
    </SubScreen>
  )
}

const styles = StyleSheet.create({
  note: { backgroundColor: colors.tipBg, borderWidth: 1, borderColor: alpha(colors.gold, 0.27), borderRadius: 9, padding: 11, marginBottom: 12 },
  noteText: { fontSize: 12, color: colors.tipText, lineHeight: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
  km: { fontSize: 12, fontWeight: '700', color: colors.accent, backgroundColor: alpha(colors.accent, 0.07), borderRadius: 6, paddingHorizontal: 9, paddingVertical: 2, overflow: 'hidden' },
  addr: { fontSize: 11, color: colors.muted, marginBottom: 9 },
})
