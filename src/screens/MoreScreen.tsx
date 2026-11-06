import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { SubScreen } from '../types'
import { useShop } from '../context/ShopContext'
import { alpha, colors, serif } from '../theme'
import { Icon, type IconName } from '../components/Icon'
import { Label, card } from '../components/ui'

interface Props {
  onOpenAdvisor: () => void
  onOpen: (s: SubScreen) => void
}

interface Entry {
  label: string
  sub: string
  icon: IconName
  tint: boolean
  action: () => void
}

const COMING_SOON = ['Push notifications', 'Family sharing', 'Live price feed', 'Barcode scanner', 'GPS store locator']

export function MoreScreen({ onOpenAdvisor, onOpen }: Props) {
  const { list, favs, history } = useShop()

  const tools: Entry[] = [
    { label: 'AI budget advisor', sub: 'Build your full list from a budget', icon: 'chat', tint: true, action: onOpenAdvisor },
    { label: 'AI assistant', sub: 'Chat about prices, recipes and tips', icon: 'chat', tint: true, action: () => onOpen('chat') },
    { label: 'Store locator', sub: 'Nearby SA grocery stores', icon: 'map', tint: true, action: () => onOpen('locator') },
  ]
  const account: Entry[] = [
    { label: 'Saved items', sub: `${favs.length} items`, icon: 'heart', tint: false, action: () => onOpen('favs') },
    { label: 'Shopping history', sub: `${history.length} trips`, icon: 'clock', tint: false, action: () => onOpen('history') },
    { label: 'Share list', sub: 'Send it to family or friends', icon: 'share', tint: false, action: () => onOpen('share') },
    { label: 'Profile and settings', sub: 'Account and preferences', icon: 'user', tint: false, action: () => onOpen('profile') },
  ]

  const renderEntry = (e: Entry) => (
    <Pressable key={e.label} onPress={e.action} style={[card, styles.entry]}>
      <View style={[styles.entryIcon, { backgroundColor: e.tint ? alpha(colors.accent, 0.07) : colors.pill }]}>
        <Icon name={e.icon} size={15} color={e.tint ? colors.accent : colors.sub} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.entryTitle}>{e.label}</Text>
        <Text style={styles.entrySub}>{e.sub}</Text>
      </View>
      <Icon name="chevronRight" size={13} color={colors.muted} strokeWidth={2} />
    </Pressable>
  )

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 13 }}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.sub}>Tools, history and account</Text>
      </View>
      <View style={styles.stats}>
        {[
          { l: 'List', v: list.length },
          { l: 'Saved', v: favs.length },
          { l: 'Trips', v: history.length },
        ].map((s) => (
          <View key={s.l} style={[card, styles.stat]}>
            <Text style={styles.statValue}>{s.v}</Text>
            <Text style={styles.statLabel}>{s.l.toUpperCase()}</Text>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <Label text="Tools" />
        <View style={{ gap: 7 }}>{tools.map(renderEntry)}</View>
        <Label text="My account" style={{ marginTop: 14 }} />
        <View style={{ gap: 7 }}>{account.map(renderEntry)}</View>
        <Label text="Coming in V2" style={{ marginTop: 14 }} />
        <View style={{ gap: 7 }}>
          {COMING_SOON.map((name) => (
            <View key={name} style={styles.soon}>
              <Text style={styles.soonText}>{name}</Text>
              <Text style={styles.soonTag}>SOON</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 25, fontWeight: '900', color: colors.text, fontFamily: serif, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 7, paddingHorizontal: 16, paddingBottom: 12 },
  stat: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 10 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.accent },
  statLabel: { fontSize: 9, fontWeight: '700', color: colors.muted, letterSpacing: 1, marginTop: 2 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, paddingHorizontal: 13, borderRadius: 10 },
  entryIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  entryTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  entrySub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  soon: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingVertical: 11, paddingHorizontal: 13, opacity: 0.55 },
  soonText: { fontSize: 13, color: colors.muted },
  soonTag: { fontSize: 9, fontWeight: '700', color: colors.muted, letterSpacing: 0.8, backgroundColor: colors.pill, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
})
