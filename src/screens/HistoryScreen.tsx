import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useShop } from '../context/ShopContext'
import { colors } from '../theme'
import { formatDate, rand } from '../utils/format'
import { EmptyState, OutlineButton, SubScreen, card } from '../components/ui'

export function HistoryScreen({ onBack, onRestored }: { onBack: () => void; onRestored: () => void }) {
  const { history, restoreTrip } = useShop()

  return (
    <SubScreen title="Shopping history" subtitle={`${history.length} trips`} onBack={onBack}>
      {history.length === 0 ? (
        <EmptyState icon="clock" title="No history yet" body="Save a trip from your list and it appears here." />
      ) : (
        <View style={{ gap: 9 }}>
          {history.map((trip) => (
            <View key={trip.id} style={[card, { overflow: 'hidden' }]}>
              <View style={styles.head}>
                <View>
                  <Text style={styles.store}>{trip.store}</Text>
                  <Text style={styles.meta}>{formatDate(trip.date)}, {trip.items.length} items</Text>
                </View>
                <Text style={styles.total}>{rand(trip.total)}</Text>
              </View>
              <View style={{ padding: 12 }}>
                <View style={styles.chips}>
                  {trip.items.slice(0, 5).map((it) => (
                    <Text key={it.name} style={styles.chip}>{it.name} x{it.qty}</Text>
                  ))}
                  {trip.items.length > 5 ? <Text style={styles.more}>+{trip.items.length - 5} more</Text> : null}
                </View>
                <OutlineButton
                  title="Restore this list"
                  onPress={() => {
                    restoreTrip(trip)
                    onRestored()
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </SubScreen>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: colors.pill, borderBottomWidth: 1, borderBottomColor: colors.border },
  store: { fontSize: 13, fontWeight: '700', color: colors.text },
  meta: { fontSize: 11, color: colors.muted, marginTop: 1 },
  total: { fontSize: 16, fontWeight: '800', color: colors.accent },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  chip: { fontSize: 10, color: colors.sub, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  more: { fontSize: 10, color: colors.muted, paddingVertical: 2 },
})
